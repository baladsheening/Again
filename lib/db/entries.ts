import 'server-only'

import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm'

import { db } from './client'
import { entries, items, profiles, type Entry, type EntryState, type Item } from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'
import { runOverlap } from '@/lib/overlap'
import { specFor } from '@/lib/vocabulary'
import { PUBLIC_STATES } from '@/lib/domain'
import type { EntryCard, EntrySource, Intent, Kind } from '@/lib/domain'

/**
 * §5 Views. `archive` and `dropped` are deliberately absent from `PublicView` —
 * see `listEntriesForOtherUser` below.
 *
 * `dropped` is a view rather than a route: the archive page renders it as a
 * second band under the tried ones, so nothing in the collection bar points at
 * it. It is a view because the band needs its own query — a page that fetched
 * both states together and split them in the component would paginate the two
 * bands as one list, which is only correct while nobody has fifty of either.
 */
export type OwnerView = 'live' | 'go_back_tos' | 'fixtures' | 'archive' | 'dropped'
export type PublicView = 'live' | 'go_back_tos' | 'fixtures'

export type EntryWithItem = { entry: Entry; item: Item }

/**
 * What another person's entry may be.
 *
 * ⚠ **Named columns, never `entries`.** `select({ entry: entries })` returns
 * whatever the table happens to hold, so the day a private column is added it is
 * already in every public read — nothing fails, nothing looks wrong, and the
 * guarantee is gone. `note` is that column. Listing the public ones by hand means
 * a new private field is excluded by default rather than by memory.
 *
 * Adding a column here is a decision to publish it. Do not spread `entries`.
 */
const PUBLIC_ENTRY_COLUMNS = {
  id: entries.id,
  userId: entries.userId,
  itemId: entries.itemId,
  intent: entries.intent,
  state: entries.state,
  returnCount: entries.returnCount,
  source: entries.source,
  sourceUserId: entries.sourceUserId,
  createdAt: entries.createdAt,
  resolvedAt: entries.resolvedAt,
} as const

export type PublicEntry = Omit<Entry, 'note'>
export type PublicEntryWithItem = { entry: PublicEntry; item: Item }

/**
 * Reduce a row to what a view needs (§10, and the Next.js data-security
 * guide). `user_id`, `source_user_id` and the timestamps stay on the server.
 */
/** Takes the public shape, so it cannot be the thing that carries `note` out. */
export function toEntryCard({ entry, item }: PublicEntryWithItem): EntryCard {
  const metadata = (item.metadata ?? {}) as { posterPath?: string | null }
  return {
    id: entry.id,
    kind: item.kind,
    intent: entry.intent,
    state: entry.state,
    title: item.title,
    year: item.year,
    posterPath: metadata.posterPath ?? null,
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
    // Tried and would not return to, versus never tried at all. Two bands on one
    // page, and keeping them apart is the whole reason `dropped` exists (§5.1).
    case 'dropped':
      return eq(entries.state, 'dropped' as const)
  }
}

function orderFor(view: OwnerView) {
  /*
    Go-back-tos used to rank by how many times you had been back (§1). The count
    was removed on 8 August, so the ranking falls back to its own tiebreaker:
    most recently resolved first. See docs/decisions.md — the sort key going is
    part of what removing the count cost.
  */
  if (view === 'go_back_tos') {
    return [desc(entries.resolvedAt)]
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
 * The caller's own entries. Every view, including the two private ones —
 * `done` and `dropped` are both visible to their owner (§5.3).
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

/**
 * How many entries sit in each collection, for the shell rail.
 *
 * **One grouped statement, not four counts.** Four `count(*)` queries to render
 * four numbers on every page is the shape §6 warns about for overlap, and the
 * argument is the same here: it is a per-row query where a set-based one does.
 *
 * `go_back_to` is deliberately counted twice — once in `live` and once in
 * `go_back_tos` — because a go-back-to is still a want (§5.2). The two numbers
 * summing to more than the number of rows is the model showing through, not an
 * error.
 *
 * Unpaginated by design, and it is the one read in the layer that is allowed to
 * be: it returns a fixed handful of integers whatever the size of the table, so
 * §10's rule against unbounded selects has nothing to bite on.
 */
export async function countMyEntries(
  sessionUser: SessionUser,
): Promise<Record<OwnerView, number>> {
  const rows = await db
    .select({ state: entries.state, count: sql<number>`count(*)::int` })
    .from(entries)
    .where(eq(entries.userId, sessionUser.id))
    .groupBy(entries.state)

  const byState = new Map(rows.map((r) => [r.state, r.count]))
  const n = (state: EntryState) => byState.get(state) ?? 0

  /*
    ⚠ **These are page counts, not state counts, and two of them show it.**
    `live` is `want` + `go_back_to` because a go-back-to is still a want (§5.2),
    which is also why `go_back_to` is counted twice — the two numbers summing to
    more than the number of rows is the model showing through, not an error.

    `archive` is the same kind of number for the same kind of reason: that page
    is two bands, so the count beside it in the rail is what the page holds. A
    number that ignored the second band would read `0` on an account whose
    archive plainly has rows in it.
  */
  return {
    live: n('want') + n('go_back_to'),
    go_back_tos: n('go_back_to'),
    fixtures: n('fixture'),
    archive: n('done') + n('dropped'),
    dropped: n('dropped'),
  }
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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Adding something you dropped revives the row — 21 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **This is the undo on `dropped`, and it is why that state needs no control of
 * its own.** The row is unique on (user, item, intent), so wanting something
 * again cannot insert a second one; without the `do update` below it would hit
 * the conflict and come back as *already yours* — a film sitting in a band you
 * cannot act on, which the person would reasonably call a bug.
 *
 * The `set` writes exactly what the insert would have written, so a revived row
 * is indistinguishable from a fresh one and `created` is true for both. That
 * includes `source` and `source_user_id`, which are read from **this** add
 * rather than left over from the one that lapsed: they are the input to §6's
 * suppression rule, and a stale `sourceUserId` would silently withhold a
 * notification that should now fire.
 *
 * `created_at` is reset because it is the clock §5.1's undo window runs on and
 * the sort key the live list ranks by — a want that restarted today belongs at
 * the top of the list and inside its own undo window. It is `now()` in SQL,
 * like the window's own comparison, so the two cannot disagree about the time.
 * The original add date is not kept anywhere: the row means *my relationship to
 * this thing*, and that relationship started again.
 *
 * ⚠ **`setWhere` is what keeps this from being a general upsert.** Only a
 * `dropped` row is revived. Everything else — a want, a go-back-to, a fixture,
 * an archived entry — still takes the no-op path below, so the idempotency §10
 * asks for is unchanged and a second tap can never overwrite a resolution.
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
    const [written] = await tx
      .insert(entries)
      .values({
        userId: sessionUser.id,
        itemId: input.itemId,
        intent: input.intent,
        state: 'want',
        source: input.source ?? 'self',
        sourceUserId: input.sourceUserId ?? null,
      })
      .onConflictDoUpdate({
        target: [entries.userId, entries.itemId, entries.intent],
        // The existing row, not `excluded` — Postgres resolves an unqualified
        // column in this clause to the row already in the table.
        setWhere: eq(entries.state, 'dropped'),
        set: {
          state: 'want',
          resolvedAt: null,
          createdAt: sql`now()`,
          source: input.source ?? 'self',
          sourceUserId: input.sourceUserId ?? null,
        },
      })
      .returning()

    if (!written) {
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

    await fireOverlap(tx, sessionUser, written)
    return ok({ entry: written, created: true })
  })
}

/**
 * What this user already has for one catalogue item, named the way the catalogue
 * names it rather than by our `items.id`.
 *
 * **The film screen is the caller** (`components/film-screen.tsx`): it opens on a
 * TMDB id off the wall or a search result, and it has to know whether that film
 * is already on your list before you touch anything. That is the whole
 * justification for the green — a colour that only ever appeared for a second
 * after a tap would be decoration, and §11 does not spend colours on decoration.
 *
 * ⚠ **Owner-only, and it deliberately includes `done`.** §5 makes the archive
 * private *from other people*; this is your own read of your own rows, filtered
 * on `sessionUser.id` like everything else in this layer. A film you have watched
 * is still on your list, so it still answers yes — and it has to, or the screen
 * would offer to add something `addEntry` will refuse as a duplicate.
 *
 * ⚠ **`dropped` is excluded for exactly that reason inverted — 21 August.** A
 * film you let go is not on your list; you said so. The screen should offer the
 * `+` again, and `addEntry` revives the row rather than colliding with it (see
 * its note), so the duplicate the clause above guards against cannot happen
 * here. This is why the film screen needs no branch on `dropped`: it never
 * learns about one.
 *
 * The bound is not pagination so much as arithmetic: `entries` is unique on
 * (user, item, intent), so this can return at most one row per intent and there
 * are two for a film. `LIMIT` is there because §10 says no unbounded select, and
 * a ceiling that can never be reached is the cheapest kind to have.
 */
export type ListedEntry = { entryId: string; intent: Intent; state: EntryState }

export async function listMyEntriesForExternalId(
  sessionUser: SessionUser,
  input: { kind: Kind; externalId: string },
): Promise<ListedEntry[]> {
  const rows = await db
    .select({ id: entries.id, intent: entries.intent, state: entries.state })
    .from(entries)
    .innerJoin(items, eq(entries.itemId, items.id))
    .where(
      and(
        eq(entries.userId, sessionUser.id),
        eq(items.kind, input.kind),
        eq(items.externalId, input.externalId),
        ne(entries.state, 'dropped'),
      ),
    )
    .limit(8)

  return rows.map((r) => ({ entryId: r.id, intent: r.intent, state: r.state }))
}

/**
 * Copy something off someone else's page (§6, `source = 'copy'`).
 *
 * The caller passes the **entry id it can already see**, never an item id: the
 * item is resolved here, so a client cannot name a row it was never shown.
 *
 * Three things this gets right by construction rather than by instruction:
 *
 *   - **Only a public state can be copied.** The same positive filter as
 *     `listEntriesForOtherUser`, spelled again here because this is a second
 *     door onto the same rows — and it was `ne(state, 'done')` in both places
 *     until `dropped` arrived and made naming one state by hand wrong in both.
 *     It returns `not_found` rather than `forbidden`, deliberately: *that exists
 *     but is private* is itself the leak (§5.3).
 *   - **It always lands as a `want`.** Copying someone's fixture must not assert
 *     that you own the thing too, and copying a go-back-to must not claim you
 *     have been. `addEntry` writes `state: 'want'` for everyone, so the intent
 *     carries over and the state does not.
 *   - **`sourceUserId` is read from the row, never taken from the caller**,
 *     because it is the input to §6's suppression rule. A caller that could
 *     name its own source could switch the suppression off, which would turn
 *     copying someone's list into a way of pinging them.
 */
export async function copyEntry(
  sessionUser: SessionUser,
  sourceEntryId: string,
): Promise<Result<{ entry: Entry; created: boolean }>> {
  const [source] = await db
    .select({
      itemId: entries.itemId,
      intent: entries.intent,
      ownerId: entries.userId,
      state: entries.state,
    })
    .from(entries)
    .where(and(eq(entries.id, sourceEntryId), inArray(entries.state, PUBLIC_STATES)))
    .limit(1)

  if (!source) return err('not_found', 'That is no longer there.')

  // Copying your own entry is the same item under the same intent, which the
  // unique constraint would swallow as a no-op — say so instead of pretending.
  if (source.ownerId === sessionUser.id) {
    return err('conflict', 'That one is already yours.')
  }

  return addEntry(sessionUser, {
    itemId: source.itemId,
    intent: source.intent,
    source: 'copy',
    sourceUserId: source.ownerId,
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
      .set({ state, resolvedAt: new Date() })
      .where(eq(entries.id, entryId))
      .returning()

    // §6 runs on any state change. A want·own becoming a fixture is what makes
    // the lend match fire for someone who wants to see it.
    await fireOverlap(tx, sessionUser, updated)

    return ok(updated)
  })
}

/**
 * Let a want go — 21 August. *Not any more.*
 *
 * The third exit from a want, beside the two `resolveEntry` offers. **It is a
 * resolution, not a delete** (§5.1): the row stays, its state changes, and the
 * entry says a true thing instead of the false one the archive was being made to
 * hold. See docs/decisions.md for why the absence of this was corrupting `done`.
 *
 * ⚠ **`want` only, and that is the whole rule.** The guard is the same clause
 * `resolveEntry` uses, which makes the set of droppable entries exactly the set
 * of resolvable ones — a want has three exits and nothing else has any.
 *
 *   - A **go-back-to** is not droppable, and the temptation is real: you saw it,
 *     you said you would return, you would not now. But you *did* see it, and
 *     dropping it would take that out of the record — the honest destination is
 *     `done`, which already means *tried, and not going back*. Getting there
 *     needs a resolve on an already-resolved entry, which is a separate gap;
 *     docs/decisions.md carries it as open.
 *   - A **fixture** is a thing you own, and letting go of one is a fact about
 *     the object rather than about the intention.
 *   - An **archived** entry is already at rest.
 *
 * ⚠ **No `fireOverlap`, and this is not an omission.** Overlap only ever adds
 * matches, and every predicate in `classify` is positive — `dropped` appears in
 * none of them, so a fan-out here would run two queries to write nothing.
 * `resolveEntry` fires because one of its outcomes (`want·own` → `fixture`) does
 * create a match; this one has a single outcome and it creates none.
 *
 * Notifications already sent are left alone. §5.1 is about entries rather than
 * notification rows, but the reasoning carries: someone was told about a
 * convergence that was true when it fired, and quietly withdrawing it later would
 * make the six kinds in §6 less trustworthy, not more.
 *
 * One statement, so no transaction: there is a single write and nothing to keep
 * consistent with it.
 */
export async function dropEntry(
  sessionUser: SessionUser,
  entryId: string,
): Promise<Result<Entry>> {
  const [updated] = await db
    .update(entries)
    // `resolved_at` because this *is* a resolution — it is what the archive's
    // second band sorts and dates by, the same as the first.
    .set({ state: 'dropped', resolvedAt: new Date() })
    .where(
      and(
        eq(entries.id, entryId),
        // Filtered on the owner as well as the id, like every other mutation
        // here: the only entry you can let go of is one of yours.
        eq(entries.userId, sessionUser.id),
        eq(entries.state, 'want'),
      ),
    )
    .returning()

  /*
    One message for both misses. A row that is not yours and a row that is no
    longer a want are indistinguishable from here on purpose — *that exists but
    is not yours* is the same shape of leak `copyEntry` avoids (§5.3).
  */
  if (!updated) return err('not_found', 'That is not a want any more.')
  return ok(updated)
}

/*
  `incrementReturn` was here. It was the only writer of `return_count`, and both
  it and the count were removed on 8 August — see docs/decisions.md.

  The column survives, unread and unwritten, holding whatever it held. §5 says
  nothing is ever deleted, and while that rule is about entries rather than
  columns, dropping it would destroy the only counts anyone has recorded for the
  sake of tidiness. It costs nothing to leave.
*/

/** §10 bounds it at the boundary; this is the same number, owned here. */
export const NOTE_MAX = 140

/**
 * Write the private note on your own entry.
 *
 * Filtered on `userId` as well as `id`, so the only entry you can annotate is one
 * you own — the same clause that makes `resolveEntry` safe. An empty string clears
 * it to `null` rather than storing a blank, so "no note" has one representation.
 *
 * Not covered by the undo window and not deleted by it: a note is a correction to
 * your own record, and there is nothing to take back but the text itself.
 */
export async function setEntryNote(
  sessionUser: SessionUser,
  entryId: string,
  note: string | null,
): Promise<Result<PublicEntry & { note: string | null }>> {
  const trimmed = note?.trim() ?? ''
  if (trimmed.length > NOTE_MAX) return err('invalid', 'That note is too long.')

  const [updated] = await db
    .update(entries)
    .set({ note: trimmed === '' ? null : trimmed })
    .where(and(eq(entries.id, entryId), eq(entries.userId, sessionUser.id)))
    .returning()

  if (!updated) return err('not_found', 'No such entry.')
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
  // `displayName` as well as the handle: notifications only cross mutual tracks,
  // which is the condition §5 attaches names to — see `nameFor` in lib/domain.ts.
  const [me] = await tx
    .select({ handle: profiles.handle, displayName: profiles.displayName })
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
      displayName: me.displayName,
      intent: entry.intent,
      state: entry.state,
      source: entry.source,
      sourceUserId: entry.sourceUserId,
    },
    item,
  )
}

/**
 * Another user's entries.
 *
 * `state = 'done'` — tried and not pushed to go-back-tos — is private (§5.3), and
 * so is `state = 'dropped'`. The filter below is unconditional and there is
 * deliberately no parameter that can turn it off: `PublicView` cannot express
 * either of them, and the `PUBLIC_STATES` clause holds regardless of which view
 * is asked for.
 *
 * ⚠ **It lists what may be seen rather than excluding what may not — 21 August.**
 * This was `ne(state, 'done')`, which is correct exactly as long as `done` is the
 * only private state. Adding `dropped` made it wrong in the way this whole
 * function exists to guard against: nothing throws, nothing looks broken, and
 * somebody's abandoned wants are on their page for anyone to read. The positive
 * filter inverts which way the mistake falls — a state that is added and not put
 * in `PUBLIC_STATES` disappears from public views, and a missing row is a fault
 * someone reports rather than one nobody sees.
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
): Promise<PublicEntryWithItem[]> {
  const rows = await db
    .select({ entry: PUBLIC_ENTRY_COLUMNS, item: items })
    .from(entries)
    .innerJoin(items, eq(items.id, entries.itemId))
    .where(
      and(
        eq(entries.userId, targetUserId),
        // Unconditional. Not derived from `view`, not overridable by a caller.
        inArray(entries.state, PUBLIC_STATES),
        stateFilter(view),
      ),
    )
    .orderBy(...orderFor(view))
    .limit(limit)
    .offset(offset)

  return rows
}
