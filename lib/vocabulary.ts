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
 * ⚠⚠ **THIS SAID RENAMING `want` TO `active` WAS A POSTGRES ENUM MIGRATION.
 * THERE IS NO ENUM AND THERE NEVER WAS — corrected 5 September.** Every
 * vocabulary column is plain `text` with a compile-time-only `$type<>`; up and
 * down are both `UPDATE`s. **That false claim is what deferred the migration
 * from 24 August**, and the rename it called impossible has since shipped:
 * `0012`–`0014` split `captures.state` onto `status` (active/completed/dropped)
 * and `verdict` (null/again/have), and nothing reads `state` any more.
 *
 * ⚠ **So this table is legacy and the work left on it is a UI move, not a
 * migration.** `STATE_WORD` is still keyed on `EntryState` and still speaks film
 * vocabulary, as do `WHERE_IT_IS`, `COLLECTIONS` and the tray; projections carry
 * a legacy `state` through `legacyState` so no component has had to change.
 * `docs/re-direction/vocabulary-migration.md` is the runbook. ⚠ When it moves,
 * `PUBLIC_STATES` is the line that has to be **re-derived** rather than renamed
 * in place — a positive list of three whose members are read against the new
 * set, because renaming its members without re-reading it is the one edit here
 * that can leak somebody's private rows.
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

/* -------------------------------------------------------------------------- */
/*  The way out — Amendment 10, 11 September                                   */
/* -------------------------------------------------------------------------- */

/**
 * **The message a convergence hands you.**
 *
 * The product reset that produced Amendment 10 turned on one sentence: *a
 * convergence currently produces a notification, not an opportunity.* Two people
 * both wanting pottery is a coincidence; a message ready to send is the payoff.
 * This is that message. Again builds no chat, no calendar and no RSVP — it
 * writes the line and gets out of the way.
 *
 * ⚠⚠ **THE PERSON'S OWN WORDING, QUOTED, NEVER INJECTED INTO A SENTENCE
 * FRAME.** *Want to `${text}` together?* breaks the moment somebody writes *a
 * trip to Japan*, and rewriting *learn to sail* into *Sailing lessons* would
 * break the provenance rule at the one moment the words leave the app — §6
 * requires that what a person typed survives, and this is where that stops
 * being an internal nicety. Quoting is what makes it total over arbitrary text.
 *
 * ⚠⚠ **IT DOES NOT BRANCH ON `NotificationKind`, AND THAT IS FORCED RATHER THAN
 * LAZY.** `portalSentence` branches because it has one kind; **a portal line
 * does not** — `listMyPortal` groups every notification about one capture into
 * one row, so a line can be a `convergence` and a `guide` at once and there is
 * no single kind to read. So the draft is about the *capture*, which every kind
 * shares, rather than about the event. ⚠ **The cost, stated: for a `lend` —
 * they own a copy, you want one — *Want to?* is the wrong question**, and the
 * right one is *could I borrow it*. It is affordable because `lend` and `guide`
 * both need a non-null intention and nothing has written one since 22 August.
 * **If either becomes reachable, this is the line to branch — and the branch
 * needs a kind the grouped line does not currently carry.**
 *
 * ⚠ **It does not name the app, and that is not modesty.** Both people are
 * notified, so the recipient already knows why this arrived; a sentence
 * explaining Again would be the product talking in somebody else's message.
 *
 * ⚠ **It lives here rather than beside `portalSentence`**, which is where §6's
 * drift rule would put it: `lib/overlap.ts` is `server-only` and this is read by
 * a client component. **If a fourth register is ever written, keep all of them
 * in one place and move this one to it** — three ways of saying one event in
 * three files is exactly what that rule exists to stop.
 */
export function askDraft(text: string): string {
  return `We both saved “${text}”. Want to?`
}

/**
 * **What a mutual connection actually does**, said once.
 *
 * ⚠⚠ **THE ONE DISCLOSURE THIS PRODUCT CANNOT LEAVE TO A GESTURE.** Amendment
 * 10: *mutuality is the technical consent boundary, but a hidden lock gesture is
 * not sufficient consumer explanation. Before a connection becomes mutual, each
 * person must be told that independently written captures can create one-line
 * overlaps with that person.* Somebody who writes *leave my job* deserves to
 * have known, **before writing it**, that a friend who writes the same thing
 * will be told they both did.
 *
 * ⚠⚠ **THE SECOND SENTENCE IS DOING AS MUCH WORK AS THE FIRST.** The likeliest
 * misreading of *you'll both be told* is *they can see my list*, which is false
 * — Amendment 2 drew that line and the data layer still enforces all four of its
 * terms. **Saying what does not happen is what makes the disclosure trustworthy
 * rather than alarming**, and a version that stated only the exposure would
 * scare people out of a feature that is narrower than it sounds.
 *
 * ⚠ **Two call sites, one author** — sending a request and answering one. §6's
 * argument about `portalSentence` applies to any sentence said in two places:
 * two literals is two copies to keep in step, and the day the rule changes one
 * of them keeps the old promise.
 *
 * ⚠ **Not at onboarding, and that is a decision rather than an oversight.** The
 * harm needs *both* a sensitive capture and a mutual connection; at onboarding
 * neither exists, so the sentence describes something that cannot yet happen to
 * the reader — and a sentence you cannot act on is a sentence you do not read.
 * **The first request is the first moment the rule can bite**, in either
 * direction, and that is where it is said.
 *
 * ⚠ **It does not say *matching*.** That word was flagged on 4 September as not
 * being in §3's vocabulary, and *write the same thing* is plainer than any term
 * this app could coin for it.
 */
export const MATCHING_RULE =
  'If you both write the same thing, you’ll both be told. Nobody can read your record.'
