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
 *  Three functions carry guarantees that are invisible when broken, and all
 *  three are covered by tests (§13):
 *    - `listCapturesForOtherUser` returns a capture only when its scope is
 *      shared, the track is mutual both ways, and its state is published
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

/*
  `entries` is read-only from Phase 0 on. The mutations that were exported here
  are gone — they are in `./captures` now, against `captures` — and what
  remains is the compatibility projection: the reads that let the migration be
  compared against its own source while both tables exist.
*/
export {
  listMyEntries,
  countMyEntries,
  listMyEntriesForExternalId,
  listEntriesForOtherUser,
  toEntryCard,
} from './entries'
export type {
  OwnerView,
  PublicView,
  EntryWithItem,
  ListedEntry,
  PublicEntry,
  PublicEntryWithItem,
  Page,
} from './entries'

/*
  The capture layer. It replaces the entry mutations above rather than sitting
  beside them: `entries` is read-only from Phase 0 on, and the two functions
  that carry silent guarantees have capture counterparts that carry the same
  ones — `listCapturesForOtherUser` never returns an unpublished state, and it
  additionally requires a shared scope and a mutual track in both directions.
*/
export {
  listMyCaptures,
  listMyPage,
  listMySettled,
  searchMyCaptures,
  getMyCaptureText,
  suggestForCapture,
  acceptSuggestion,
  declineSuggestion,
  countMyCaptures,
  listMyCapturesForExternalId,
  listCapturesForOtherUser,
  addCapture,
  copyCapture,
  resolveCapture,
  dropCapture,
  restoreCapture,
  setCaptureNote,
  setCaptureText,
  setCaptureVisibility,
  undoCapture,
  toCaptureCard,
  pageCursor,
  parsePageCursor,
  NOTE_MAX,
  PAGE_SIZE,
  TEXT_MAX,
  UNDO_WINDOW_MS,
} from './captures'
export type {
  SharedView,
  CaptureWithPossibility,
  SharedCapture,
  SharedCaptureWithPossibility,
  CaptureCard,
  PageLine,
  ListedCapture,
  AddCaptureInput,
} from './captures'

export { upsertItem } from './items'
export type { ItemInput } from './items'

export { upsertPossibility } from './possibilities'
export type { PossibilityInput } from './possibilities'

export { getSwap } from './swaps'
export type { SwapView } from './swaps'

export type {
  Capture,
  CaptureSource,
  CaptureState,
  Entry,
  EntrySource,
  EntryState,
  Intent,
  Item,
  Kind,
  Possibility,
  Notification,
  NotificationKind,
  Profile,
  Swap,
  SwapStatus,
  Visibility,
} from './schema'
