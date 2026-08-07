import 'server-only'

import { and, desc, eq, inArray, ne } from 'drizzle-orm'

import { db } from './client'
import { entries, items, type Entry, type Item } from './schema'
import type { SessionUser } from './session'

/** §5 Views. `archive` is deliberately absent from `PublicView` — see below. */
export type OwnerView = 'live' | 'go_back_tos' | 'fixtures' | 'archive'
export type PublicView = 'live' | 'go_back_tos' | 'fixtures'

export type EntryWithItem = { entry: Entry; item: Item }

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
