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

/**
 * §5, plus `dropped` — 21 August.
 *
 * `dropped` is the exit a lapsed want had nowhere else to go. Without it the
 * only way out of *I wanted this in March and I don't now* was **Seen it → Go
 * back? → no**, which files the row in the archive: you had to claim you watched
 * something you didn't. The archive is meant to be the record of what you
 * actually tried, so mistakes and lapsed intentions landing there stop `done`
 * meaning done. See docs/decisions.md.
 *
 * It is a **resolution, not a delete** (§5.1 — nothing is ever deleted). Private
 * like `done`, out of the live pool, out of overlap, out of everyone else's view.
 */
export type EntryState = 'want' | 'done' | 'go_back_to' | 'fixture' | 'dropped'

/**
 * The states another person may be shown. **The list is positive on purpose.**
 *
 * `listEntriesForOtherUser` and `copyEntry` used to exclude one state by name —
 * `ne(state, 'done')` — which is correct only for as long as `done` is the only
 * private state. Adding `dropped` made that line wrong in the way §13 warns
 * about: nothing fails, nothing looks wrong, and somebody's abandoned wants are
 * on their page.
 *
 * Filtering on this instead inverts the failure. A state that is added and not
 * listed here is invisible to strangers — the mistake produces a missing row
 * rather than a leak, which is the direction it has to fail in.
 *
 * ⚠ **Adding a state to this array is a decision to publish it.** There is no
 * other way a state becomes visible to someone else, and there should not be.
 */
export const PUBLIC_STATES = [
  'want',
  'go_back_to',
  'fixture',
] as const satisfies readonly EntryState[]

/** How an entry got here. Drives the §6 suppression rule. */
export type EntrySource = 'self' | 'copy' | 'swap'

/* -------------------------------------------------------------------------- */
/*  The re-direction (Phase 0). Captures, possibilities, provenance, scope.    */
/* -------------------------------------------------------------------------- */

/**
 * A capture's lifecycle, and deliberately the same five values as
 * `EntryState`.
 *
 * Every legacy entry is backfilled into a capture, so the two unions have to
 * agree at the moment of migration or the backfill loses information. The
 * specification does say these outcomes will generalise — *bought*, *visited*,
 * *tried* and *watched* are not one word — but generalising them is a product
 * change with screens attached, and Phase 0 is the phase where nothing the
 * user can see moves.
 *
 * ⚠ The alias is the record of that: when the outcomes do generalise, this is
 * the line that stops being an alias, and `PUBLIC_STATES` is the line that has
 * to be re-derived beside it.
 */
export type CaptureState = EntryState

/* -------------------------------------------------------------------------- */
/*  The vocabulary migration, stage 1 — status and verdict. STEP A of four.    */
/* -------------------------------------------------------------------------- */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  A capture's LIFECYCLE, as §3 and §5 of the specification describe it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Three values, against `CaptureState`'s five, and the difference is the point:
 * **the five conflate two axes.** `want`, `done` and `dropped` are lifecycle;
 * `go_back_to` and `fixture` are *verdicts on a finished thing* — I would do
 * that again, I own that now — which is not a stage of a life but an opinion
 * about one. §5 asks the detail surface to show *the user's intention **and**
 * status*, two fields, and this is the first of them.
 *
 * ⚠⚠ **NOTHING READS THIS YET AND THAT IS DELIBERATE — this is step A of four.**
 * The column is added and backfilled; the code still reads and writes `state`.
 * See `docs/re-direction/vocabulary-migration.md` for the order and why it is
 * that order. **Do not start reading `status` in the same deploy that adds it**:
 * the whole safety of this sequence is that every step is revert-safe on its
 * own, and a read added here would make the migration and the deploy one act.
 *
 * ⚠ **`dropped` keeps its own value rather than becoming a verdict.** A
 * crossed-off capture is a lifecycle fact — it left the pool — and it is
 * *private*, which `PUBLIC_STATES` depends on. Folding it into
 * `completed` + a verdict would put the privacy question inside a nullable
 * column, which is the wrong place for the one guarantee that must fail closed.
 */
export type CaptureStatus = 'active' | 'completed' | 'dropped'

/**
 * What a finished capture turned out to be worth. **The second axis.**
 *
 * `again` is `go_back_to` — an experience worth repeating. `have` is `fixture`
 * — a thing now possessed. Both are only meaningful on a `completed` capture,
 * and the check constraint in the schema says so rather than trusting callers.
 *
 * ⚠ **Null is a real and common value**, not a missing one: a capture that was
 * completed with no opinion attached is `completed` with a null verdict, which
 * is today's `done`. That is why this is nullable and why the absence has to
 * mean something specific rather than *not filled in yet*.
 *
 * ⚠ **A verdict is PUBLIC and a bare completion is PRIVATE**, which is the one
 * thing about this pair that can leak. §5.3 makes `done` owner-only; `again`
 * and `have` are on somebody's page. So the re-derived `PUBLIC_STATES` is not
 * a function of `status` alone — see the note there.
 */
export type CaptureVerdict = 'again' | 'have'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  `PUBLIC_STATES`, RE-DERIVED — the one edit in this migration that can leak
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `PUBLIC_STATES` is `['want', 'go_back_to', 'fixture']`. Under the two-axis
 * vocabulary that is **not one list**, because the three do not share an axis:
 * `want` is a status and the other two are verdicts. So it becomes two positive
 * lists, and a row is public when **either** matches.
 *
 * ⚠⚠ **TWO ALLOWLISTS AND NEVER A DENYLIST, which is the whole point.** The
 * temptation is `status !== 'dropped' && verdict !== null`, which is shorter and
 * is the exact shape `listEntriesForOtherUser` had before `dropped` was added —
 * correct only until the next value exists, and its failure is somebody's
 * private rows on their page. A value added and not listed here is **invisible**:
 * the mistake produces a missing row, not a leak. That is the direction it has
 * to fail in, and it is why this is not derived from the other two.
 *
 * ⚠ **A `completed` capture can be public.** `again` and `have` are verdicts on
 * a finished thing and they are on somebody's page; `completed` with a null
 * verdict is today's `done`, which §5.3 makes owner-only. So a reader that
 * checked `status` alone would hide every *Again* and *Have* — wrong, but wrong
 * in the safe direction, which is the test worth having.
 *
 * ⚠ **Asserted against the old list in SQL, in BOTH directions**, by
 * `scripts/verify-status-backfill.mjs`: every old-public row is new-public and
 * every new-public row was old-public. A one-way check passes on a conversion
 * that also published rows it should not have.
 */
export const PUBLIC_STATUSES = ['active'] as const satisfies readonly CaptureStatus[]

/** The other half of the pair above. Read them together or not at all. */
export const PUBLIC_VERDICTS = ['again', 'have'] as const satisfies readonly CaptureVerdict[]

/**
 * How a capture got here. **Server-owned, and immutable once written.**
 *
 * This is the provenance the §6 suppression rule reads: a capture copied from
 * the person you would otherwise converge with is not an independent common
 * intention, and pinging them that you match is telling them something they
 * are the source of.
 *
 * `transfer` is the third value the re-direction adds, for the in-person
 * exchange in §9. It occupies the slot `EntrySource` reserved for `swap`,
 * which was designed and never built.
 *
 * ⚠ There is no `unknown`, and there must not be one. A capture whose origin
 * is unknown is a capture whose suppression cannot be decided, and the failure
 * would be a notification sent to the one person it should never reach.
 */
export type CaptureSource = 'self' | 'copy' | 'transfer'

/**
 * Who, apart from its owner, a capture can reach.
 *
 * **Private is the default, the floor, and what every migrated row lands as.**
 * Release 1 supports exactly one sharing scope. Selected-person sharing waits
 * for an access-control table, and public discovery waits for Phase 6's
 * consent, blocking, reporting and moderation requirements.
 */
export type Visibility = 'private' | 'mutuals'

/**
 * The scopes that can reach another person, as a positive list.
 *
 * ⚠ **Adding a scope to this array is a decision to publish it**, in exactly
 * the sense `PUBLIC_STATES` means it. The two arrays have the same shape for
 * the same reason: a scope that is added and not listed here is invisible,
 * so the mistake produces a missing row rather than a leak.
 */
export const SHARED_SCOPES = ['mutuals'] as const satisfies readonly Visibility[]

/*
  **Visibility is a fourth positive term, not a replacement for the other
  three.** A capture reaches another person only when all of these hold:

  1. its scope is in `SHARED_SCOPES`
  2. the relationship is a *mutual* track — both rows of `tracks` exist
  3. its state is in `PUBLIC_STATES`
  4. the reader is not its owner, who sees everything of their own anyway

  ⚠ **Retiring the state allowlist because a visibility column now exists
  would reintroduce the bug that `dropped` exposed.** A private state on a
  shared capture must stay unreachable; scope answers *who*, state answers
  *what*, and neither answers the other's question.

  The conjunction is enforced in `lib/db/` and nowhere else — there is no RLS
  backstop. It is deliberately not written as a predicate here: a second copy
  in TypeScript is a second thing to keep true, and the copy that runs is the
  SQL one.
*/

/* -------------------------------------------------------------------------- */

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
