import type { Route } from 'next'

import type { EntryState, Intent, Kind } from '@/lib/domain'

/**
 * §4. The naming is load bearing: "go-back-to" states the entry criterion,
 * which is why it stays the label.
 *
 * Never use, in UI or in identifiers: recommendation, review, rating, score,
 * favourite, saved, bookmark, feed. (Enforced by `no-restricted-syntax` in
 * eslint.config.mjs.)
 */

/** Collection labels. Verbs vary, collections don't — universality at the profile. */
export const COLLECTIONS = {
  wants: 'Wants',
  goBackTos: 'Go-back-tos',
  fixtures: 'Fixtures',
  archive: 'Archive',
} as const

export type IntentSpec = {
  /** The surfaced label, derived from kind + intent. Never asked of the user. */
  wantLabel: string
  /** The button that resolves the want. */
  resolveAction: string
  /** The single question asked on resolve. */
  question: string
  /** Where "yes" lands it. "No" always lands in `done`. */
  landsIn: Extract<EntryState, 'go_back_to' | 'fixture'>
}

/*
  `returnCountable`, `returnAgainLabel` and `countLabel` were here. All three
  described the return count, which was removed on 8 August — see
  docs/decisions.md.

  `landsIn` carries what is left of the distinction they encoded. A kind+intent
  landing in `go_back_to` is an experience you can repeat; one landing in
  `fixture` is a thing you own. That was the real difference; counting was one
  expression of it, not the fact itself.
*/

/**
 * A kind gets two intents where consumption and possession can come apart, and
 * one where they can't (§4). Films and books: two. Places: one (`try`) — there
 * is nothing to own. Objects: one (`own`) — using it is owning it.
 *
 * v1 implements the two `film` rows. The rest are here so the table is designed
 * for, not retrofitted.
 */
export const VOCABULARY: Record<Kind, Partial<Record<Intent, IntentSpec>>> = {
  film: {
    see: {
      wantLabel: 'Want to see',
      resolveAction: 'Seen it',
      question: 'Go back?',
      landsIn: 'go_back_to',
    },
    own: {
      wantLabel: 'Want a copy',
      resolveAction: 'Got it',
      question: 'Keeping it?',
      landsIn: 'fixture',
    },
  },
  book: {
    read: {
      wantLabel: 'Want to read',
      resolveAction: 'Read it',
      question: 'Go back?',
      landsIn: 'go_back_to',
    },
    own: {
      wantLabel: 'Want a copy',
      resolveAction: 'Got it',
      question: 'Keeping it?',
      landsIn: 'fixture',
    },
  },
  place: {
    try: {
      wantLabel: 'Want to try',
      resolveAction: 'Been',
      question: 'Go back?',
      landsIn: 'go_back_to',
    },
  },
  object: {
    own: {
      wantLabel: 'Want one',
      resolveAction: 'Got it',
      question: 'Keeping it?',
      landsIn: 'fixture',
    },
  },
}

/** The intent offered first when someone adds a thing of this kind. */
export const DEFAULT_INTENT: Record<Kind, Intent> = {
  film: 'see',
  book: 'read',
  place: 'try',
  object: 'own',
}

/** Intents a kind supports, default first. Drives the add sheet in §8. */
export function intentsFor(kind: Kind): Intent[] {
  const preferred = DEFAULT_INTENT[kind]
  const all = Object.keys(VOCABULARY[kind]) as Intent[]
  return [preferred, ...all.filter((i) => i !== preferred)]
}

export function specFor(kind: Kind, intent: Intent): IntentSpec {
  const spec = VOCABULARY[kind][intent]
  if (!spec) throw new Error(`No spec for ${kind}/${intent}`)
  return spec
}

/* -------------------------------------------------------------------------- */
/*  The words — Phase 1                                                       */
/* -------------------------------------------------------------------------- */

/**
 * What each state is called on screen.
 *
 * | stored | on screen |
 * |---|---|
 * | `want` | nothing — it *is* the page |
 * | `go_back_to` | **Again** |
 * | `fixture` | **Have** |
 * | `done` | **Done** |
 * | `dropped` | nothing — struck through, in place |
 *
 * *Again* is the argument. `go_back_to` was chosen because it states the entry
 * criterion, and the criterion generalises perfectly — a film you would watch
 * again, a place you would go again, a class you would take again — while being
 * the app's own name. *Have* is the generic of `fixture`: the distinction
 * `landsIn` encodes is real, an experience you can repeat against a thing you
 * now possess.
 *
 * ⚠ **The stored values do not move, and that is not an oversight.** Renaming
 * `want` to `active` is a Postgres enum migration with every row in the product
 * behind it, and Phase 1's page is schema-free by design. **These are the words;
 * the identifiers follow in the migration**, and when they do, `PUBLIC_STATES`
 * is the line that has to be re-derived beside them rather than renamed in
 * place — a positive list of three whose members are read against the new set,
 * because renaming its members without re-reading it is the one edit in this
 * phase that can leak somebody's private rows.
 *
 * ⚠ **`null` is a word too.** Two states deliberately say nothing: an active
 * capture is the page, and a crossed-off one has a strikethrough already saying
 * it. A label on either would be the app narrating what the screen shows.
 */
export const STATE_WORD: Record<EntryState, string | null> = {
  want: null,
  go_back_to: 'Again',
  fixture: 'Have',
  done: 'Done',
  dropped: null,
}

/**
 * Where a capture is, from its state — **the one place that answers "where did
 * it go".**
 *
 * Two destinations now, where there were four collections: the page, and the
 * tray. Everything live is on the page; everything settled is behind the tray.
 * That is the same reduction `listMyPage` and `listMySettled` make, spelled in
 * routes, and the four collection routes went with it.
 *
 * ⚠ **`done` is in the tray, and the tray is the owner's own screen.** §5.3
 * makes `state = 'done'` private — never in anyone else's view, never in an
 * aggregate — so anything using this must already be looking at its own
 * captures. `listMyCapturesForExternalId` is the only source of the state that
 * reaches it.
 *
 * ⚠ **Whether the tray is one surface or three is still open.** It is one here
 * because the states stay distinct inside it either way, so splitting it later
 * changes these three `href`s and nothing that reads them.
 */
export const WHERE_IT_IS: Record<EntryState, { href: Route; label: string }> = {
  /*
    A crossed-off capture is still on the page — struck through, where it was.
    That is the whole design of the ×, so this points where every other live row
    points.
  */
  want: { href: '/', label: 'the page' },
  dropped: { href: '/', label: 'the page' },
  go_back_to: { href: '/settled', label: 'Again' },
  fixture: { href: '/settled', label: 'Have' },
  done: { href: '/settled', label: 'Done' },
}
