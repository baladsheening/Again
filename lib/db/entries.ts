import 'server-only'

import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm'

import { db } from './client'
import { entries, items, profiles, type Entry, type Item } from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'
import { runOverlap } from '@/lib/overlap'
import { specFor } from '@/lib/vocabulary'
import type { EntryCard, EntrySource, Intent } from '@/lib/domain'

/** §5 Views. `archive` is deliberately absent from `PublicView` — see below. */
export type OwnerView = 'live' | 'go_back_tos' | 'fixtures' | 'archive'
export type PublicView = 'live' | 'go_back_tos' | 'fixtures'

export type EntryWithItem = { entry: Entry; item: Item }

/**
 * Reduce a row to what a view needs (§10, and the Next.js data-security
 * guide). `user_id`, `source_user_id` and the timestamps stay on the server.
 */
export function toEntryCard({ entry, item }: EntryWithItem): EntryCard {
  const metadata = (item.metadata ?? {}) as { posterPath?: string | null }
  return {
    id: entry.id,
    kind: item.kind,
    intent: entry.intent,
    state: entry.state,
    title: item.title,
    year: item.year,
    posterPath: metadata.posterPath ?? null,
    returnCount: entry.returnCount,
  }
}

const PAGE_SIZE = 50

/** §10: paginate every list. No unbounded select on a profile with 4,000 entries. */
export type Page = { limit?: number; offset?: number }

function stateFilter(view: OwnerView) {
  switch (view) {
    // A go-back-to is still a want (§5.2) — the live pool is both states, so
    // overlap can pair someone who's been eleven times with someone curious.
    case 'live':
      return inArray(entries.state, ['want', 'go_back_to'] as const)
    case 'go_back_tos':
      return eq(entries.state, 'go_back_to' as const)
    case 'fixtures':
      return eq(entries.state, 'fixture' as const)
    case 'archive':
      return eq(entries.state, 'done' as const)
  }
}

function orderFor(view: OwnerView) {
  // Go-back-tos rank by how many times you actually have been back (§1).
  if (view === 'go_back_tos') {
    return [desc(entries.returnCount), desc(entries.resolvedAt)]
  }

  /*
    The live view mixes `want` with `go_back_to` (§5.2 — a go-back-to is still a
    want). Satisfied ones sink below everything still unwatched, so the top of
    the list is what you have not seen yet, which is what the list is for.

    Written as an explicit CASE rather than ordering on the enum: 'go_back_to'
    happens to sort before 'want' alphabetically, so `desc(entries.state)` would
    produce the right answer today by accident and the wrong one the moment a
    state is renamed or added.
  */
  if (view === 'live') {
    return [
      asc(sql`case when ${entries.state} = 'want' then 0 else 1 end`),
      desc(entries.createdAt),
    ]
  }

  return [desc(entries.createdAt)]
}

/**
 * The caller's own entries. All four views, including `archive`, because
 * `state = 'done'` is visible to its owner (§5.3).
 */
export async function listMyEntries(
  sessionUser: SessionUser,
  view: OwnerView,
  { limit = PAGE_SIZE, offset = 0 }: Page = {},
): Promise<EntryWithItem[]> {
  const rows = await db
    .select({ entry: entries, item: items })
    .from(entries)
    .innerJoin(items, eq(items.id, entries.itemId))
    .where(and(eq(entries.userId, sessionUser.id), stateFilter(view)))
    .orderBy(...orderFor(view))
    .limit(limit)
    .offset(offset)

  return rows
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/** How long a freshly created entry can be taken back (§5.1). */
export const UNDO_WINDOW_MS = 10_000

/**
 * Add a want.
 *
 * Idempotent (§10): adding the same item twice under one intent is a no-op, not
 * a duplicate row and not a second notification. `created` tells the caller
 * which happened, and overlap only runs when something actually changed.
 *
 * Entry write and notification rows share one transaction, so they never
 * partially apply (§10).
 */
export async function addEntry(
  sessionUser: SessionUser,
  input: {
    itemId: string
    intent: Intent
    source?: EntrySource
    sourceUserId?: string | null
  },
): Promise<Result<{ entry: Entry; created: boolean }>> {
  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(entries)
      .values({
        userId: sessionUser.id,
        itemId: input.itemId,
        intent: input.intent,
        state: 'want',
        source: input.source ?? 'self',
        sourceUserId: input.sourceUserId ?? null,
      })
      .onConflictDoNothing({
        target: [entries.userId, entries.itemId, entries.intent],
      })
      .returning()

    if (!inserted) {
      const [existing] = await tx
        .select()
        .from(entries)
        .where(
          and(
            eq(entries.userId, sessionUser.id),
            eq(entries.itemId, input.itemId),
            eq(entries.intent, input.intent),
          ),
        )
        .limit(1)

      if (!existing) return err('conflict', 'Could not add that.')
      return ok({ entry: existing, created: false })
    }

    await fireOverlap(tx, sessionUser, inserted)
    return ok({ entry: inserted, created: true })
  })
}

/**
 * Resolve a want (§8). `keep` answers the single question — *Go back?* for an
 * experience, *Keeping it?* for an object.
 *
 * Yes lands it in go-back-tos or fixtures depending on kind + intent; no lands
 * it in `done`, which is private to its owner forever after (§5.3). Nothing is
 * deleted either way (§5.1).
 */
export async function resolveEntry(
  sessionUser: SessionUser,
  entryId: string,
  keep: boolean,
): Promise<Result<Entry>> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ entry: entries, item: items })
      .from(entries)
      .innerJoin(items, eq(items.id, entries.itemId))
      .where(and(eq(entries.id, entryId), eq(entries.userId, sessionUser.id)))
      .limit(1)

    if (!current) return err('not_found', 'No such entry.')
    if (current.entry.state !== 'want') {
      return err('conflict', 'That has already been resolved.')
    }

    const spec = specFor(current.item.kind, current.entry.intent)
    const state = keep ? spec.landsIn : ('done' as const)

    const [updated] = await tx
      .update(entries)
      .set({
        state,
        resolvedAt: new Date(),
        // An experience you would go back to has been had once, by definition.
        returnCount: keep && spec.returnCountable ? 1 : 0,
      })
      .where(eq(entries.id, entryId))
      .returning()

    // §6 runs on any state change. A want·own becoming a fixture is what makes
    // the lend match fire for someone who wants to see it.
    await fireOverlap(tx, sessionUser, updated)

    return ok(updated)
  })
}

/**
 * *Seen it again*, and the equivalent per kind. Manual, one tap, no check-ins,
 * no location (§8). The label lives in `lib/vocabulary.ts`; this is the write.
 *
 * No overlap run: the state has not changed, only the count, and §6 fires on
 * insert and state change. Re-notifying everyone each time you rewatch
 * something would be exactly the noise the notification budget forbids.
 */
export async function incrementReturn(
  sessionUser: SessionUser,
  entryId: string,
): Promise<Result<Entry>> {
  const [updated] = await db
    .update(entries)
    .set({ returnCount: sql`${entries.returnCount} + 1` })
    .where(
      and(
        eq(entries.id, entryId),
        eq(entries.userId, sessionUser.id),
        eq(entries.state, 'go_back_to'),
      ),
    )
    .returning()

  if (!updated) return err('not_found', 'No such go-back-to.')
  return ok(updated)
}

/**
 * The one exception to "nothing is ever deleted" (§5.1): a 10-second undo on
 * creation, for typos. Bounded by `created_at` in SQL rather than trusted from
 * the client, and it will not touch anything already resolved.
 *
 * Phase 3 note: once push delivery exists, the worker must not fire inside this
 * window, or an undone typo will still have buzzed someone's phone.
 */
export async function undoEntry(
  sessionUser: SessionUser,
  entryId: string,
): Promise<Result<null>> {
  const [deleted] = await db
    .delete(entries)
    .where(
      and(
        eq(entries.id, entryId),
        eq(entries.userId, sessionUser.id),
        eq(entries.state, 'want'),
        sql`${entries.createdAt} > now() - make_interval(secs => ${UNDO_WINDOW_MS / 1000})`,
      ),
    )
    .returning()

  if (!deleted) return err('not_found', 'Too late to undo that.')
  return ok(null)
}

/** Shared by add and resolve so the §6 call site is identical in both. */
async function fireOverlap(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  sessionUser: SessionUser,
  entry: Entry,
) {
  const [me] = await tx
    .select({ handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.id, sessionUser.id))
    .limit(1)

  const [item] = await tx
    .select({ id: items.id, title: items.title })
    .from(items)
    .where(eq(items.id, entry.itemId))
    .limit(1)

  if (!me || !item) return

  await runOverlap(
    tx,
    {
      userId: entry.userId,
      handle: me.handle,
      intent: entry.intent,
      state: entry.state,
      source: entry.source,
      sourceUserId: entry.sourceUserId,
      returnCount: entry.returnCount,
    },
    item,
  )
}

/**
 * Another user's entries.
 *
 * `state = 'done'` — tried and not pushed to go-back-tos — is private (§5.3).
 * The exclusion below is unconditional and there is deliberately no parameter
 * that can turn it off: `PublicView` cannot express `archive`, and the
 * `ne(state, 'done')` clause holds regardless of which view is asked for.
 *
 * Do not add an `includeArchive` flag to this function. Do not rely on callers
 * passing the right filter. This is one of the two places in the product where
 * a silent bug damages trust rather than function (§13).
 */
export async function listEntriesForOtherUser(
  _viewer: SessionUser,
  targetUserId: string,
  view: PublicView,
  { limit = PAGE_SIZE, offset = 0 }: Page = {},
): Promise<EntryWithItem[]> {
  const rows = await db
    .select({ entry: entries, item: items })
    .from(entries)
    .innerJoin(items, eq(items.id, entries.itemId))
    .where(
      and(
        eq(entries.userId, targetUserId),
        // Unconditional. Not derived from `view`, not overridable by a caller.
        ne(entries.state, 'done'),
        stateFilter(view),
      ),
    )
    .orderBy(...orderFor(view))
    .limit(limit)
    .offset(offset)

  return rows
}
