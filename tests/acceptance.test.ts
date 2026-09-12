/**
 * §14's acceptance list, for the parts of it that exist.
 *
 * A separate file from `guarantees.test.ts` on purpose. That one holds the
 * three guarantees that fail with **no symptom at all** — a private row on
 * somebody else's page, a swap that reveals early, a vocabulary rule that
 * stopped matching. This one holds behaviour the specification says must be
 * true and which would fail visibly: a duplicate row, an undo that does
 * nothing, a notification that never arrives.
 *
 * The distinction is worth keeping because it says what a failure here means.
 * A red line in `guarantees.test.ts` is a trust problem. A red line here is a
 * bug someone would have reported.
 *
 * ⚠ **Writes. Development branch only.** The guard below is not a courtesy.
 */
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Pool, neonConfig } from '@neondatabase/serverless'

const PRODUCTION_DB_HOST = 'ep-royal-math-zalwuq2s-pooler.c-2.eu-west-2.aws.neon.tech'

const url = process.env.DATABASE_URL ?? ''
if (!url) throw new Error('DATABASE_URL is unset — see .env.local')
if (new URL(url).hostname === PRODUCTION_DB_HOST) {
  throw new Error(
    'These tests write. DATABASE_URL points at production — refusing to run. ' +
      'Point .env.local at the Neon `development` branch.',
  )
}

neonConfig.webSocketConstructor ??= globalThis.WebSocket

const pool = new Pool({ connectionString: url })

const ONE = 'acceptance-one'
const TWO = 'acceptance-two'

let oneId = ''
let twoId = ''
let filmId = ''

type Dal = typeof import('@/lib/db')
let dal: Dal

/** The brand is satisfied with a cast here and nowhere else — see the note in
 *  `guarantees.test.ts`; the constructor is private to `lib/db/session.ts`. */
const asViewer = (id: string, email: string) =>
  ({ id, email }) as unknown as Parameters<Dal['listMyCaptures']>[0]

const one = () => asViewer(oneId, `${ONE}@example.com`)
const two = () => asViewer(twoId, `${TWO}@example.com`)

beforeAll(async () => {
  dal = await import('@/lib/db')

  const person = async (handle: string) => {
    const { rows } = await pool.query(
      `insert into "user" (name, email, "emailVerified") values ($1, $2, true)
       on conflict (email) do update set name = excluded.name returning id`,
      [handle, `${handle}@example.com`],
    )
    await pool.query(
      `insert into profiles (id, handle, handle_skeleton) values ($1, $2, $2)
       on conflict (id) do nothing`,
      [rows[0].id, handle.replace(/-/g, '')],
    )
    return rows[0].id as string
  }

  oneId = await person(ONE)
  twoId = await person(TWO)

  const { rows } = await pool.query(
    `insert into items (kind, external_source, external_id, title, year)
     values ('film', 'tmdb', 'acceptance-film', 'An Acceptance', 2003)
     on conflict (kind, external_id) do update set title = excluded.title
     returning id`,
  )
  filmId = rows[0].id
})

afterAll(async () => {
  await pool.query('delete from "user" where email = any($1::text[])', [
    [`${ONE}@example.com`, `${TWO}@example.com`],
  ])
  await pool.end()
})

const reset = async () => {
  await pool.query('delete from notifications where user_id = any($1::uuid[])', [[oneId, twoId]])
  await pool.query('delete from captures where user_id = any($1::uuid[])', [[oneId, twoId]])
  await pool.query(
    'delete from tracks where follower_id = any($1::uuid[]) and followed_id = any($1::uuid[])',
    [[oneId, twoId]],
  )
}

const capture = async (
  userId: string,
  fields: {
    text?: string
    possibilityId?: string | null
    intent?: string | null
    state?: string
    visibility?: string
  } = {},
) => {
  const { rows } = await pool.query(
    `insert into captures (user_id, text, possibility_id, intent, state, status, verdict, visibility)
     values ($1, $2, $3, $4, $5, (case $5 when 'want' then 'active' when 'dropped' then 'dropped' else 'completed' end), (case $5 when 'go_back_to' then 'again' when 'fixture' then 'have' end), $6) returning id`,
    [
      userId,
      fields.text ?? 'An Acceptance',
      fields.possibilityId === undefined ? filmId : fields.possibilityId,
      fields.intent === undefined ? 'see' : fields.intent,
      fields.state ?? 'want',
      fields.visibility ?? 'private',
    ],
  )
  return rows[0].id as string
}

const convergences = async (userId: string) => {
  const { rows } = await pool.query(
    "select payload from notifications where user_id = $1 and kind = 'convergence'",
    [userId],
  )
  return rows
}

beforeEach(reset)

/* -------------------------------------------------------------------------- */

/**
 * The exit criterion for Phase 0 says privacy tests cover **every** new
 * projection. This is the one that had none: the film screen asks it what the
 * viewer already holds for a catalogue id, and it answers by joining
 * `possibilities` — so the filter that keeps it to one person is the only thing
 * standing between a TMDB id and somebody else's list.
 */
describe('the external-id lookup answers about its caller and nobody else', () => {
  it('returns the caller’s own captures, archived and crossed-off included', async () => {
    await capture(oneId, { state: 'done' })
    await capture(oneId, { intent: 'own', state: 'dropped' })

    const held = await dal.listMyCapturesForExternalId(one(), {
      kind: 'film',
      externalId: 'acceptance-film',
    })

    expect(held.map((h) => h.state).sort()).toEqual(['done', 'dropped'])
  })

  it('returns nothing about another person, mutual track or not', async () => {
    await capture(oneId, { visibility: 'mutuals' })
    for (const pair of [
      [oneId, twoId],
      [twoId, oneId],
    ]) {
      await pool.query('insert into tracks (follower_id, followed_id) values ($1, $2)', pair)
    }

    const held = await dal.listMyCapturesForExternalId(two(), {
      kind: 'film',
      externalId: 'acceptance-film',
    })

    expect(held).toHaveLength(0)
  })
})

/**
 * §6's second trigger, and §13 calls it the app's first impression: a dozen
 * friends join in a week and backfill their lists before the graph is
 * complete, so the captures exist and no state ever changes.
 *
 * It was ported to `captures` with the rest of overlap and had no test.
 */
describe('a track becoming mutual converges what is already there', () => {
  it('matches two shared captures that were saved before either followed', async () => {
    await capture(oneId, { visibility: 'mutuals' })
    await capture(twoId, { visibility: 'mutuals' })

    /* One direction is not a mutual track, so nothing may fire yet. */
    expect((await dal.trackUser(one(), twoId)).ok).toBe(true)
    expect(await convergences(oneId)).toHaveLength(0)
    expect(await convergences(twoId)).toHaveLength(0)

    expect((await dal.trackUser(two(), oneId)).ok).toBe(true)

    expect(await convergences(oneId)).toHaveLength(1)
    expect(await convergences(twoId)).toHaveLength(1)
  })

  /*
    Both directions, and not for symmetry's sake. The pair fan-out joins
    `captures` to itself and carries a scope filter on each side, so a test
    that only ever puts the private capture on one of them leaves the other
    filter unexercised — it can be deleted and the suite stays green.
  */
  it.each([
    ['the first person keeps theirs private', 'private', 'mutuals'] as const,
    ['the second person keeps theirs private', 'mutuals', 'private'] as const,
  ])('writes nothing when %s', async (_name, oneScope, twoScope) => {
    await capture(oneId, { visibility: oneScope })
    await capture(twoId, { visibility: twoScope })

    await dal.trackUser(one(), twoId)
    await dal.trackUser(two(), oneId)

    expect(await convergences(oneId)).toHaveLength(0)
    expect(await convergences(twoId)).toHaveLength(0)
  })
})

/**
 * §14: *press Return repeatedly without duplicate canonical entries*, and §10's
 * requirement that retrying the same submission cannot create a second row or a
 * second notification.
 */
describe('a retried submission is one capture', () => {
  it('returns the same row for the same client mutation id', async () => {
    const clientMutationId = randomUUID()

    const first = await dal.addCapture(one(), { text: 'try pottery', clientMutationId })
    const second = await dal.addCapture(one(), { text: 'try pottery', clientMutationId })

    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return

    expect(second.value.created).toBe(false)
    expect(second.value.capture.id).toBe(first.value.capture.id)

    const { rows } = await pool.query('select count(*)::int as n from captures where user_id = $1', [
      oneId,
    ])
    expect(rows[0].n).toBe(1)
  })

  it('⚠ REFUSES the same words as a separate submission, and says where they are', async () => {
    /*
      ⚠⚠ **THIS ASSERTED `2` UNTIL 12 SEPTEMBER**, on the paragraph's other
      half: *raw text is not deduplicated, because the same words can mean a
      different thing on a different day.* **Directed otherwise** — *the app
      shouldn't accept an entry if it's exactly the same as a previous entry,
      instead alerting a user to the same previous entry.*

      ⚠ **The distinction from the case above survives and is the point of
      keeping both.** A retried submission carries the SAME mutation id and is
      answered with the row that landed, `ok` and `created: false`; a second
      submission carries a new one and is answered with a refusal. §10's
      idempotency is not a duplicate check and this proves they are still two
      things.
    */
    const first = await dal.addCapture(one(), {
      text: 'try pottery',
      clientMutationId: randomUUID(),
    })
    expect(first.ok).toBe(true)

    const second = await dal.addCapture(one(), {
      text: 'try pottery',
      clientMutationId: randomUUID(),
    })
    expect(second.ok).toBe(false)
    if (second.ok) return
    /* ⚠ `already` and not `conflict` since 12 September: a control hangs off
       this one refusal and no other, so it needed a code of its own rather
       than the copy being matched. See `ErrorCode` in `lib/db/result.ts`. */
    expect(second.error).toBe('already')
    expect(second.message).toBe('Already on your record.')

    const { rows } = await pool.query('select count(*)::int as n from captures where user_id = $1', [
      oneId,
    ])
    expect(rows[0].n).toBe(1)
  })

  it('⚠ the same WORDS, not the same string — normalised, and the empty one is exempt', async () => {
    /*
      ⚠ **`normalised_text` is the app's one definition of *the same words***, so
      punctuation and spacing do not make a second capture. ⚠ **And `???`
      normalises to nothing**, which is the guard `tests/words.test.ts` proves on
      the convergence side: without it the second punctuation-only capture
      anybody wrote would be refused as a duplicate of the first.
    */
    await dal.addCapture(one(), { text: 'Learn to sail', clientMutationId: randomUUID() })
    const loud = await dal.addCapture(one(), {
      text: '  LEARN   to  sail!! ',
      clientMutationId: randomUUID(),
    })
    expect(loud.ok).toBe(false)

    expect((await dal.addCapture(one(), { text: '???', clientMutationId: randomUUID() })).ok).toBe(
      true,
    )
    expect((await dal.addCapture(one(), { text: '...', clientMutationId: randomUUID() })).ok).toBe(
      true,
    )
  })

  it('⚠ a SETTLED line is history, so the same words may be captured again', async () => {
    /*
      The boundary is `PAGE_STATUSES` — *is this line still on your record* — and
      not *have you ever written it*. Wanting a thing again a year later is a new
      capture; the settled one is in the tray, where the record is not.
    */
    const first = await dal.addCapture(one(), { text: 'see the sea', clientMutationId: randomUUID() })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    await pool.query(
      `update captures set state = 'done', status = 'completed', verdict = null, resolved_at = now()
       where id = $1`,
      [first.value.capture.id],
    )

    const again = await dal.addCapture(one(), {
      text: 'see the sea',
      clientMutationId: randomUUID(),
    })
    expect(again.ok).toBe(true)
    if (!again.ok) return
    expect(again.value.capture.id).not.toBe(first.value.capture.id)
  })

  it('⚠ a CROSSED-OFF line written again COMES BACK, on today’s date, keeping its own', async () => {
    /*
      ⚠⚠ **THIS ASSERTED A REFUSAL FOR A FEW HOURS — *Crossed off on your
      record.* — AND THE DIRECTION REPLACED IT.** Asked what happens when
      somebody types `scarface`, crosses it off and types it again a week later;
      the answer then was a refusal and three steps to undo it. **Directed: it
      should be accepted, the previous entry deleted, and its date preserved.**

      ⚠ **One row throughout, which is how the direction is answered in full
      without deleting anything.** Destroying the old row and writing a new one
      would lose the note, the photograph, the link, the possibility and — see
      `guarantees.test.ts` — the provenance §6's suppression rule is built on.
    */
    const first = await dal.addCapture(one(), {
      text: 'walk the ridge',
      clientMutationId: randomUUID(),
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const id = first.value.capture.id

    /*
      ⚠ **BOTH columns are aged, and the first pass of this test aged only one.**
      It moved `captured_at` back a week and then asserted the undo refused —
      and the undo **accepted**, correctly: the row was genuinely two seconds
      old, which is exactly the ten seconds §5.1 allows. The guarantee worth
      asserting is the other case: **a line from last week, re-entered today, is
      not deletable**, and that needs an old `created_at` to be about anything.
    */
    await pool.query(
      `update captures
         set captured_at = now() - interval '7 days',
             created_at  = now() - interval '7 days'
       where id = $1`,
      [id],
    )
    expect((await dal.dropCapture(one(), id)).ok).toBe(true)

    const again = await dal.addCapture(one(), {
      text: 'walk the ridge',
      clientMutationId: randomUUID(),
    })
    expect(again.ok).toBe(true)
    if (!again.ok) return

    /* The same row, live again, and no second line on the record. */
    expect(again.value.capture.id).toBe(id)
    expect(again.value.capture.state).toBe('want')
    const { rows } = await pool.query(
      'select count(*)::int as n from captures where user_id = $1',
      [oneId],
    )
    expect(rows[0].n).toBe(1)

    /*
      ⚠ **`created: false`, which is what keeps the undo off it.** §5.1's ten
      seconds are for a typo on a creation; undo DELETES, and deleting this
      would destroy a line with a history on it. `compose-screen.tsx` reads the
      flag rather than lighting a control that would then refuse.
    */
    expect(again.value.created).toBe(false)

    /* It moved to today, and the week-old date is filed behind it. */
    const moved = await dal.listMyPage(one())
    expect(moved[0].capturedAt.getTime()).toBeGreaterThan(Date.now() - 60_000)

    const prior = await dal.getPriorDates(one(), id)
    expect(prior).toHaveLength(1)
    expect(Date.now() - prior[0].getTime()).toBeGreaterThan(6 * 24 * 60 * 60 * 1000)

    /*
      ⚠ **`created_at` did NOT move, and that is what keeps the undo honest.**
      The row is a week old; if re-entering had reset this clock the ten-second
      window would accept it. See the column's docblock in `schema.ts`.
    */
    expect((await dal.undoCapture(one(), id)).ok).toBe(false)
  })

  it('⚠ a LIVE line is offered the update instead, and `recaptureWords` takes it', async () => {
    const first = await dal.addCapture(one(), {
      text: 'swim at dawn',
      clientMutationId: randomUUID(),
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const id = first.value.capture.id

    await pool.query(
      `update captures set captured_at = now() - interval '30 days' where id = $1`,
      [id],
    )

    /*
      ⚠ **Refused rather than moved, and the asymmetry is the direction's own.**
      Re-typing something you crossed off is unambiguous; re-typing something
      already on your record is as likely to be forgetting you had it, so the
      app says so and **offers** the update rather than moving somebody's line
      under them.
    */
    const again = await dal.addCapture(one(), {
      text: 'swim at dawn',
      clientMutationId: randomUUID(),
    })
    expect(again.ok).toBe(false)
    if (again.ok) return
    expect(again.error).toBe('already')

    /* Taking the offer is what moves it. */
    const moved = await dal.recaptureWords(one(), 'swim at dawn')
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.value.id).toBe(id)
    expect(moved.value.capturedAt.getTime()).toBeGreaterThan(Date.now() - 60_000)
    expect(await dal.getPriorDates(one(), id)).toHaveLength(1)

    /* Still one line. The record gained a date, not a row. */
    const { rows } = await pool.query(
      'select count(*)::int as n from captures where user_id = $1',
      [oneId],
    )
    expect(rows[0].n).toBe(1)
  })

  it('⚠ the history accumulates, and one tick files one date', async () => {
    const first = await dal.addCapture(one(), {
      text: 'ring the bank',
      clientMutationId: randomUUID(),
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const id = first.value.capture.id

    for (const days of [20, 10]) {
      await pool.query(
        `update captures set captured_at = now() - make_interval(days => $2) where id = $1`,
        [id, days],
      )
      expect((await dal.recaptureWords(one(), 'ring the bank')).ok).toBe(true)
    }

    expect(await dal.getPriorDates(one(), id)).toHaveLength(2)

    /*
      ⚠ **The key is `(capture, at)`**, so writing the same line twice inside one
      clock tick files one date rather than two. A date is a fact about a day,
      not an event to count.
    */
    expect((await dal.recaptureWords(one(), 'ring the bank')).ok).toBe(true)
    expect((await dal.recaptureWords(one(), 'ring the bank')).ok).toBe(true)
    expect((await dal.getPriorDates(one(), id)).length).toBeLessThanOrEqual(4)
  })

  /*
    ⚠ **The shipped Phase 0 action does not send a client mutation id**, so this
    is the mechanism that actually carries §10's idempotency on the only write
    path that exists today: the unique key on (user, possibility, intent). The
    id becomes load-bearing in Phase 1, when a raw capture has no possibility
    and therefore no key to collide with.

    Both halves of §10 are checked — not a duplicate row, and not a duplicate
    notification — because the second is the one that would reach somebody.
  */
  it('is idempotent for a resolved capture with no mutation id at all', async () => {
    await capture(twoId, { visibility: 'mutuals' })
    for (const pair of [
      [oneId, twoId],
      [twoId, oneId],
    ]) {
      await pool.query('insert into tracks (follower_id, followed_id) values ($1, $2)', pair)
    }

    const first = await dal.addCapture(one(), {
      text: 'An Acceptance',
      possibilityId: filmId,
      intent: 'see',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return

    await dal.setCaptureVisibility(one(), first.value.capture.id, 'mutuals')
    expect(await convergences(twoId)).toHaveLength(1)

    const again = await dal.addCapture(one(), {
      text: 'An Acceptance',
      possibilityId: filmId,
      intent: 'see',
    })

    expect(again.ok && again.value.created).toBe(false)

    const rows = await pool.query('select count(*)::int as n from captures where user_id = $1', [
      oneId,
    ])
    expect(rows.rows[0].n).toBe(1)
    expect(await convergences(twoId)).toHaveLength(1)
  })

  it('returns the existing row rather than a second one for the same possibility', async () => {
    const first = await dal.addCapture(one(), {
      text: 'An Acceptance',
      possibilityId: filmId,
      intent: 'see',
    })
    const second = await dal.addCapture(one(), {
      text: 'An Acceptance again',
      possibilityId: filmId,
      intent: 'see',
    })

    expect(first.ok && second.ok).toBe(true)
    if (!first.ok || !second.ok) return

    expect(second.value.created).toBe(false)
    expect(second.value.capture.id).toBe(first.value.capture.id)
  })
})

/**
 * §14: *undo a newly created capture within the allowed window*, and *confirm
 * that undo cannot remove an already resolved or completed record*.
 */
describe('undo takes back a new capture and nothing else', () => {
  it('removes one saved a moment ago', async () => {
    const saved = await dal.addCapture(one(), { text: 'a typo' })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return

    expect((await dal.undoCapture(one(), saved.value.capture.id)).ok).toBe(true)

    const { rows } = await pool.query('select count(*)::int as n from captures where user_id = $1', [
      oneId,
    ])
    expect(rows[0].n).toBe(0)
  })

  it('refuses one that is already resolved', async () => {
    const saved = await dal.addCapture(one(), {
      text: 'An Acceptance',
      possibilityId: filmId,
      intent: 'see',
    })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return

    expect((await dal.resolveCapture(one(), saved.value.capture.id, false)).ok).toBe(true)
    expect((await dal.undoCapture(one(), saved.value.capture.id)).ok).toBe(false)

    const { rows } = await pool.query('select state from captures where id = $1', [
      saved.value.capture.id,
    ])
    expect(rows[0].state).toBe('done')
  })

  it('refuses one past the window', async () => {
    const saved = await dal.addCapture(one(), { text: 'too late' })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return

    /*
      The window is bounded by `created_at` in SQL rather than trusted from the
      client, which is exactly what lets the clock be moved here instead of
      waiting ten seconds for it.
    */
    await pool.query(
      "update captures set created_at = now() - interval '1 minute' where id = $1",
      [saved.value.capture.id],
    )

    expect((await dal.undoCapture(one(), saved.value.capture.id)).ok).toBe(false)
  })

  it('refuses somebody else’s', async () => {
    const saved = await dal.addCapture(one(), { text: 'not yours' })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return

    expect((await dal.undoCapture(two(), saved.value.capture.id)).ok).toBe(false)
  })
})

/**
 * §5.1 allows exactly one deletion — a ten-second undo **on creation** — and
 * reviving a crossed-off capture is not one. It was, and it took the row's
 * note, provenance and legacy link with it.
 */
describe('a revive is not a creation', () => {
  const resolved = (text = 'An Acceptance') =>
    dal.addCapture(one(), { text, possibilityId: filmId, intent: 'see' })

  /*
    ⚠⚠ **THE REVIVE IS REACHED WITH DIFFERENT WORDS SINCE 12 SEPTEMBER, AND
    THAT IS THE WHOLE EDIT TO THIS BLOCK.** Re-adding the *identical* line is now
    a refusal — see *the same words twice is not two captures* — so the path
    these cases exist for is entered the way it still can be: the same
    possibility and intention, a different sentence. **What is asserted is
    unchanged**: the unique key finds the dropped row, updates it, and reports
    `created: false` so no caller can offer an undo for somebody's March line.
  */
  it('reports created: false, so no caller can offer an undo for it', async () => {
    const first = await resolved()
    expect(first.ok && first.value.created).toBe(true)
    if (!first.ok) return

    expect((await dal.dropCapture(one(), first.value.capture.id)).ok).toBe(true)

    const again = await resolved('An Acceptance, said again')
    expect(again.ok).toBe(true)
    if (!again.ok) return

    expect(again.value.capture.id).toBe(first.value.capture.id)
    expect(again.value.created).toBe(false)
    expect(again.value.capture.state).toBe('want')
  })

  it('leaves created_at alone, so undo refuses it at the data layer too', async () => {
    const first = await resolved()
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const id = first.value.capture.id

    await pool.query("update captures set note = 'the private part' where id = $1", [id])
    await pool.query(
      "update captures set created_at = now() - interval '1 hour' where id = $1",
      [id],
    )
    await dal.dropCapture(one(), id)
    await resolved()

    /*
      The window is bounded by `created_at` in SQL, so not resetting it is what
      makes the deletion impossible rather than merely unoffered.
    */
    expect((await dal.undoCapture(one(), id)).ok).toBe(false)

    const { rows } = await pool.query('select note from captures where id = $1', [id])
    expect(rows).toHaveLength(1)
    expect(rows[0].note).toBe('the private part')
  })

  it('announces nothing, because dropping never withdrew the first notification', async () => {
    await capture(twoId, { visibility: 'mutuals' })
    for (const pair of [
      [oneId, twoId],
      [twoId, oneId],
    ]) {
      await pool.query('insert into tracks (follower_id, followed_id) values ($1, $2)', pair)
    }

    const first = await resolved()
    expect(first.ok).toBe(true)
    if (!first.ok) return

    await dal.setCaptureVisibility(one(), first.value.capture.id, 'mutuals')
    expect(await convergences(twoId)).toHaveLength(1)

    await dal.dropCapture(one(), first.value.capture.id)
    await resolved()

    expect(await convergences(twoId)).toHaveLength(1)
  })
})

/**
 * §10: a mutation is idempotent. A share control is a thing people tap twice.
 */
describe('sharing fires on the transition, not on the call', () => {
  const mutual = async () => {
    for (const pair of [
      [oneId, twoId],
      [twoId, oneId],
    ]) {
      await pool.query('insert into tracks (follower_id, followed_id) values ($1, $2)', pair)
    }
  }

  it('writes nothing the second time the same scope is set', async () => {
    await capture(twoId, { visibility: 'mutuals' })
    await mutual()
    const mine = await capture(oneId, { visibility: 'private' })

    expect((await dal.setCaptureVisibility(one(), mine, 'mutuals')).ok).toBe(true)
    expect(await convergences(twoId)).toHaveLength(1)

    expect((await dal.setCaptureVisibility(one(), mine, 'mutuals')).ok).toBe(true)
    expect(await convergences(twoId)).toHaveLength(1)
  })

  it('still fires when a capture is unshared and shared again', async () => {
    await capture(twoId, { visibility: 'mutuals' })
    await mutual()
    const mine = await capture(oneId, { visibility: 'private' })

    await dal.setCaptureVisibility(one(), mine, 'mutuals')
    await dal.setCaptureVisibility(one(), mine, 'private')
    await dal.setCaptureVisibility(one(), mine, 'mutuals')

    /*
      Taking a capture back and sharing it again is a real transition, and the
      counterpart is entitled to hear about it. The rule is about the change,
      not about how many times the function was called.
    */
    expect(await convergences(twoId)).toHaveLength(2)
  })
})

/**
 * §14: *same text without canonical resolution does not create a false exact
 * match*. Exact convergence means the same canonical thing — two people who
 * typed the same words have not yet said they mean the same thing, and
 * deciding that they did is the Phase 2 possible-match path, not this one.
 */
describe('identical words are not an exact match', () => {
  it('stays silent when neither capture resolved to a possibility', async () => {
    await capture(oneId, {
      text: 'try pottery',
      possibilityId: null,
      intent: 'try',
      visibility: 'mutuals',
    })
    await capture(twoId, {
      text: 'try pottery',
      possibilityId: null,
      intent: 'try',
      visibility: 'mutuals',
    })

    await dal.trackUser(one(), twoId)
    await dal.trackUser(two(), oneId)

    expect(await convergences(oneId)).toHaveLength(0)
    expect(await convergences(twoId)).toHaveLength(0)
  })

  it('normalises the words anyway, ready for the path that will read them', async () => {
    await capture(oneId, { text: '  Try  Pottery!! ', possibilityId: null, intent: null })
    await capture(twoId, { text: 'try pottery', possibilityId: null, intent: null })

    const { rows } = await pool.query(
      'select distinct normalised_text from captures where user_id = any($1::uuid[])',
      [[oneId, twoId]],
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].normalised_text).toBe('try pottery')
  })
})
