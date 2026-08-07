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
  /** Experiences count returns; objects do not. */
  returnCountable: boolean
  /** The increment action, for things that have one. */
  returnAgainLabel?: string
}

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
      returnCountable: true,
      returnAgainLabel: 'Been back again',
    },
    own: {
      wantLabel: 'Want a copy',
      resolveAction: 'Got it',
      question: 'Keeping it?',
      landsIn: 'fixture',
      returnCountable: false,
    },
  },
  book: {
    read: {
      wantLabel: 'Want to read',
      resolveAction: 'Read it',
      question: 'Go back?',
      landsIn: 'go_back_to',
      returnCountable: true,
      returnAgainLabel: 'Been back again',
    },
    own: {
      wantLabel: 'Want a copy',
      resolveAction: 'Got it',
      question: 'Keeping it?',
      landsIn: 'fixture',
      returnCountable: false,
    },
  },
  place: {
    try: {
      wantLabel: 'Want to try',
      resolveAction: 'Been',
      question: 'Go back?',
      landsIn: 'go_back_to',
      returnCountable: true,
      returnAgainLabel: 'Been back again',
    },
  },
  object: {
    own: {
      wantLabel: 'Want one',
      resolveAction: 'Got it',
      question: 'Keeping it?',
      landsIn: 'fixture',
      returnCountable: false,
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

/** v1 ships films only. Guards the entry points against the kinds not yet built. */
export const V1_KINDS: Kind[] = ['film']
