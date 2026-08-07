/**
 * The domain unions from §4 and §5.
 *
 * These live outside `lib/db/` deliberately. They are vocabulary, not schema —
 * the client needs to name an intent to render a label, and `lib/db/` is
 * `server-only`. Keeping them here means a Client Component can speak the
 * domain without being able to reach the database.
 */

/** v1 ships `film` only. The rest exist so the table is designed for, not retrofitted. */
export type Kind = 'film' | 'book' | 'place' | 'object'

/**
 * What you want to *do* with it. Intent is a property of the entry, never of
 * the item: the same film is an experience to one person and an object to
 * another, and can be both to the same person. Never infer it from `kind`.
 */
export type Intent = 'see' | 'own' | 'try' | 'read'

export type EntryState = 'want' | 'done' | 'go_back_to' | 'fixture'

/** How an entry got here. Drives the §6 suppression rule. */
export type EntrySource = 'self' | 'copy' | 'swap'

export type SwapStatus = 'pending' | 'committed' | 'complete' | 'declined'

/**
 * The complete set (§6, "Notification budget"). Do not add more.
 * No digests, no streaks, no re-engagement, no "you haven't opened the app."
 */
export type NotificationKind =
  | 'convergence'
  | 'guide'
  | 'lend'
  | 'swap_invite'
  | 'swap_revealed'
  | 'landed'
