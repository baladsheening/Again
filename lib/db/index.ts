import 'server-only'

/**
 * The data-access layer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE SINGLE MOST IMPORTANT STRUCTURAL RULE IN THE BUILD (§3)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The database is never reachable from the client. Every query goes through
 *  this layer. Every function in it takes the authenticated `SessionUser` as
 *  its first argument and filters on it.
 *
 *  No Server Component, Server Action or route handler may query Drizzle
 *  directly.
 *
 *  There is no Row Level Security in this design and it isn't needed — but
 *  that also means there is no backstop. The privacy guarantees in §5 and §7
 *  are enforced here and nowhere else, so if access spreads across the
 *  codebase they quietly stop holding.
 *
 *  Three things hold the rule up:
 *
 *  1. `import 'server-only'` at the top of every module in here. Importing any
 *     of it from a Client Component is a build error, not a review comment.
 *
 *  2. `SessionUser` is a branded type whose constructor is private to
 *     `./session`. A caller cannot fabricate one, so a DAL function cannot be
 *     called on behalf of a user who isn't signed in.
 *
 *  3. `no-restricted-imports` in eslint.config.mjs bans `drizzle-orm` and
 *     `./client` outside `lib/db/`. Reaching around this layer fails lint.
 *
 *  Two functions carry guarantees that are invisible when broken, and both are
 *  covered by tests (§13):
 *    - `listEntriesForOtherUser` never returns `state = 'done'` (§5.3)
 *    - `getSwap` withholds the counterparty's picks until both commit (§7.3)
 */

export { getSessionUser, requireSessionUser, UnauthorizedError } from './session'
export type { SessionUser } from './session'

export { ok, err } from './result'
export type { Result, ErrorCode } from './result'

export { getMyProfile, getProfileByHandle, createProfile } from './profiles'

export { getTrackState, listMyTracks, trackUser, untrackUser } from './tracks'
export type { TrackState, TrackedPerson } from './tracks'

export {
  listMyEntries,
  countMyEntries,
  listEntriesForOtherUser,
  addEntry,
  copyEntry,
  setEntryNote,
  NOTE_MAX,
  resolveEntry,
  undoEntry,
  UNDO_WINDOW_MS,
  toEntryCard,
} from './entries'
export type {
  OwnerView,
  PublicView,
  EntryWithItem,
  PublicEntry,
  PublicEntryWithItem,
  Page,
} from './entries'

export { upsertItem } from './items'
export type { ItemInput } from './items'

export { getSwap } from './swaps'
export type { SwapView } from './swaps'

export type {
  Entry,
  EntrySource,
  EntryState,
  Intent,
  Item,
  Kind,
  Notification,
  NotificationKind,
  Profile,
  Swap,
  SwapStatus,
} from './schema'
