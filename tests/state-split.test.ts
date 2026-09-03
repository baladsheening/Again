import { describe, expect, it } from 'vitest'

import {
  legacyState,
  PUBLIC_STATES,
  PUBLIC_STATUSES,
  PUBLIC_VERDICTS,
  STATE_SPLIT,
} from '@/lib/domain'
import type { CaptureState, CaptureStatus, CaptureVerdict } from '@/lib/domain'

/**
 * The vocabulary migration's stage 1, in the fourth test file — and it is here
 * for the reason the other three are: **it fails with no symptom.**
 *
 * `guarantees.test.ts` holds what breaks trust; `acceptance.test.ts` holds what
 * somebody would report; `vocabulary.test.ts` holds a lint rule that can stop
 * matching silently. This holds a **mapping between two vocabularies that must
 * agree**, during the several deploys in which both exist. If it drifts, a
 * capture is written with one word and read back as another, and nothing
 * anywhere says so.
 *
 * ⚠ **No database. This is the half that can be proved without one.**
 * `scripts/verify-status-backfill.mjs` is the other half — it asserts the same
 * agreement against the rows that actually exist, in SQL, in both directions,
 * and it is what ran against production's 79 captures. Two halves, each tested
 * where it can be: the shape here, the data there.
 *
 * ⚠ **All of this is deleted at step C**, with `state`, `STATE_SPLIT` and
 * `legacyState`. A file that outlives the transition it describes is the thing
 * the migration runbook says to strike as it goes.
 */

const ALL_STATES = Object.keys(STATE_SPLIT) as CaptureState[]

/** The old allowlist, written out rather than imported, so the test compares
 *  against a literal and not against the thing it is checking. */
const OLD_PUBLIC: readonly CaptureState[] = ['want', 'go_back_to', 'fixture']

/** The re-derived predicate, in the shape `lib/db/` will apply it in SQL. */
const isPublic = (status: CaptureStatus, verdict: CaptureVerdict | null) =>
  (PUBLIC_STATUSES as readonly string[]).includes(status) ||
  (verdict !== null && (PUBLIC_VERDICTS as readonly string[]).includes(verdict))

describe('the two vocabularies agree', () => {
  it('covers every state, and only the five', () => {
    expect(ALL_STATES.sort()).toEqual(['done', 'dropped', 'fixture', 'go_back_to', 'want'])
  })

  it.each(ALL_STATES)('%s round-trips through the split unchanged', (state) => {
    const { status, verdict } = STATE_SPLIT[state]
    expect(legacyState(status, verdict)).toBe(state)
  })

  /*
    ⚠ The split must be injective as well as total. Two states mapping to one
    pair would round-trip one of them into the other — silently, and only for
    whichever lost — which is exactly the failure `legacyState` cannot report.
  */
  it('is injective: no two states share a (status, verdict) pair', () => {
    const pairs = ALL_STATES.map((s) => `${STATE_SPLIT[s].status}/${STATE_SPLIT[s].verdict}`)
    expect(new Set(pairs).size).toBe(pairs.length)
  })

  it('never puts a verdict on a capture that is not completed', () => {
    for (const state of ALL_STATES) {
      const { status, verdict } = STATE_SPLIT[state]
      if (verdict !== null) expect(status).toBe('completed')
    }
  })
})

describe('the re-derived privacy predicate', () => {
  /*
    ⚠⚠ THE ONE THAT MATTERS. `PUBLIC_STATES` is the fail-closed filter standing
    between a private capture and somebody else's page, and this migration
    rewrites it from one allowlist into two. The rewrite is correct only if it
    selects **exactly** the old set — not a superset, which leaks, and not a
    subset, which hides.
  */
  it.each(ALL_STATES)('%s is public under both vocabularies or neither', (state) => {
    const { status, verdict } = STATE_SPLIT[state]
    expect(isPublic(status, verdict)).toBe(OLD_PUBLIC.includes(state))
  })

  it('agrees with the shipped PUBLIC_STATES, not just with the literal above', () => {
    expect([...PUBLIC_STATES].sort()).toEqual([...OLD_PUBLIC].sort())
  })

  /*
    ⚠ A completed capture CAN be public, and a reader that checked `status`
    alone would hide every Again and Have. That is the wrong answer in the safe
    direction, and this is the case that pins it: `PUBLIC_STATUSES` on its own
    is deliberately not the whole predicate.
  */
  it('needs the verdict list: status alone hides Again and Have', () => {
    const statusOnly = (s: CaptureStatus) => (PUBLIC_STATUSES as readonly string[]).includes(s)
    expect(statusOnly(STATE_SPLIT.go_back_to.status)).toBe(false)
    expect(statusOnly(STATE_SPLIT.fixture.status)).toBe(false)
    expect(isPublic(STATE_SPLIT.go_back_to.status, STATE_SPLIT.go_back_to.verdict)).toBe(true)
    expect(isPublic(STATE_SPLIT.fixture.status, STATE_SPLIT.fixture.verdict)).toBe(true)
  })

  /*
    ⚠ Both lists are allowlists, never denylists. A value that exists and is not
    listed must be invisible — the mistake produces a missing row rather than a
    leak. This is the assertion that catches somebody "simplifying" the pair
    into `status !== 'dropped'`, which is the shape listEntriesForOtherUser had
    before `dropped` was added.
  */
  it('treats an unlisted status as private rather than public', () => {
    expect(isPublic('completed' as CaptureStatus, null)).toBe(false)
    expect(isPublic('dropped' as CaptureStatus, null)).toBe(false)
    expect(isPublic('a-status-nobody-has-added-yet' as CaptureStatus, null)).toBe(false)
  })

  it('treats an unlisted verdict as private rather than public', () => {
    expect(isPublic('completed' as CaptureStatus, 'a-verdict-nobody-has-added-yet' as CaptureVerdict)).toBe(false)
  })
})
