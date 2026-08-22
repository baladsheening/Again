import 'server-only'

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

import { db } from './client'
import { entries, items, type Entry, type EntryState, type Item } from './schema'
import type { SessionUser } from './session'
import { PUBLIC_STATES } from '@/lib/domain'
import type { EntryCard, Intent, Kind } from '@/lib/domain'

/** §5 Views. `archive` is deliberately absent from `PublicView` — see below. */
export type OwnerView = 'live' | 'go_back_tos' | 'fixtures' | 'archive'
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
    /*
      A go-back-to is still a want (§5.2) — the live pool is both states, so
      overlap can pair someone who's been eleven times with someone curious.

      ⚠ **`dropped` is here too, and it is not in the live pool.** A crossed-off
      want stays *on the page* — struck through, in the position it held — which
      is a fact about the owner's own list and not about the pool §5.2 describes.
      It is safe to add here only because `listEntriesForOtherUser` filters on
      `PUBLIC_STATES` as well as on this: a state that is not published cannot
      reach a stranger through a view that happens to select it. That inversion
      is what makes widening this view a one-line change instead of a leak.
    */
    case 'live':
      return inArray(entries.state, ['want', 'go_back_to', 'dropped'] as const)
    case 'go_back_tos':
      return eq(entries.state, 'go_back_to' as const)
    case 'fixtures':
      return eq(entries.state, 'fixture' as const)
    case 'archive':
      return eq(entries.state, 'done' as const)
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

    ⚠ **The CASE names `go_back_to` rather than `want`, and that is what keeps a
    crossed-off row still.** It was `when state = 'want' then 0 else 1`, which
    put `dropped` in the sinking half — so crossing something off made it jump
    down the page, and putting it back made it jump up. Naming the one state that
    is *meant* to sink leaves every other row where it was, which is the whole
    point of striking a row through instead of taking it out: you can see what
    you crossed off, where it was.
  */
  if (view === 'live') {
    return [
      asc(sql`case when ${entries.state} = 'go_back_to' then 1 else 0 end`),
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
    `go_back_to` is deliberately counted twice — once in `live` and once in
    `go_back_tos` — because a go-back-to is still a want (§5.2). The two numbers
    summing to more than the number of rows is the model showing through, not an
    error.

    ⚠ **`dropped` is counted nowhere, and the Wants page renders it.** This is the
    one place the number is deliberately not the number of rows on the page: the
    rail says how many things you *want*, and a film you crossed off is not one.
    It is still on the page because you should be able to see what you crossed
    off; it is not in the count because counting it would put the strikethrough
    back into the total it was struck out of.
  */
  return {
    live: n('want') + n('go_back_to'),
    go_back_tos: n('go_back_to'),
    fixtures: n('fixture'),
    archive: n('done'),
  }
}

/*
  ⚠ **The mutations that were here are gone, and nothing replaces them in this
  file.** `addEntry`, `copyEntry`, `resolveEntry`, `dropEntry`,
  `restoreEntry`, `setEntryNote`, `undoEntry` and the `fireOverlap` they
  shared now live in `captures.ts`, against `captures`.

  **`entries` is read-only from here on.** Not frozen by convention — there is
  no function in this module that writes to it, and the exit criterion for
  Phase 0 is that no parallel write path remains. Every row in this table has a
  capture that carries the same facts and a `legacy_entry_id` pointing back at
  it, which is what the reads below are still for: comparing the migration
  against its own source while that is still possible.

  Do not add a write here. If something needs writing, it needs writing to a
  capture.
*/

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
 * ⚠ **`dropped` is included for the same reason, and briefly was not.** While a
 * crossed-off entry lived in the archive it was fair to call it *not on your
 * list* and let the screen offer the `+` again. It lives in Wants now, struck
 * through and in plain sight, so the screen saying *not on your list* would
 * contradict the page it points at. The tick links to Wants, the row is there,
 * and the way back is the × on that row — one control, in one place.
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
      ),
    )
    .limit(8)

  return rows.map((r) => ({ entryId: r.id, intent: r.intent, state: r.state }))
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
