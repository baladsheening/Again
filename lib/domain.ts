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

/**
 * How a person is named on screen (§5): *people who know you should see your
 * name; the handle is for strangers who land on your page.*
 *
 * **Knowing someone is a mutual track** — the same relation §6 already requires
 * for overlap. That is the whole reason this needs no new object: the condition
 * was in the schema before the question was asked, so the rule is a read rather
 * than a feature. It is also why groups are not required to answer it (see
 * `docs/decisions.md`, *Groups*).
 *
 * `displayName` is optional at onboarding, so a mutual with no name still falls
 * back to the handle. The fallback is not a degraded case — it is what someone
 * who never filled the field in is called.
 */
export type PersonRef = {
  handle: string
  displayName: string | null
  /** Both rows of `tracks` exist. Asymmetric following is not knowing. */
  mutual: boolean
}

/**
 * The one place the rule above is spelled. It returns the handle **with its `@`**
 * so that no call site has to decide whether to add one — a handle is never
 * shown without it, and a name is never shown with it. A caller that branches on
 * `mutual` itself is a second copy of this rule and will drift from it.
 */
export function nameFor(person: PersonRef): string {
  return person.mutual && person.displayName ? person.displayName : `@${person.handle}`
}

/**
 * A search hit, already reduced to what the app stores. The TMDB response shape
 * stops at the edge of `lib/tmdb.ts` — nothing downstream knows what a
 * `poster_path` or a `release_date` is.
 */
export type FilmSearchResult = {
  externalId: string
  title: string
  year: number | null
  posterPath: string | null
}

/**
 * What a list row needs and nothing else. Entry rows carry `user_id`,
 * `source_user_id` and timestamps that no view uses — passing whole database
 * records to Client Components is how private fields leak.
 */
export type EntryCard = {
  id: string
  kind: Kind
  intent: Intent
  state: EntryState
  title: string
  year: number | null
  posterPath: string | null
}
