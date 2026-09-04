/**
 * **Adding somebody is a request they answer — 4 September.**
 *
 * The first time Phase 2 was used by a person rather than a fixture, nothing
 * converged: two accounts, both holding the same film, **0 tracks and 0
 * notifications ever written**. A mutual track was two independent one-sided
 * acts, so the second one was forgettable and its failure was silent (§9 of
 * `docs/re-direction/phase-2-convergence.md`).
 *
 * ⚠ **The fix is a delivery, not a new object** — an outbound-only track already
 * granted nothing and was already a request; nothing handed it to the person it
 * was addressed to. `docs/re-direction/the-handshake.md` §1. So there is no new
 * table and no pending column to test: what is asserted here is that the thing
 * arrives, that answering it does the right thing in both directions, and that
 * the one genuinely new mutation cannot reach a row it does not own.
 *
 * What is proved:
 *
 *   1. Adding writes the other person a `track_request` — and writes **no**
 *      track for them, so nothing has been granted by asking.
 *   2. Asking twice writes one, by the primary key rather than by a check.
 *   3. It lights the portal's door and is **invisible to the line read**, which
 *      is where the privacy join lives.
 *   4. **Accepting runs the fan-out.** This is the whole reason the feature
 *      exists and it cannot be seen from a screen — see the brief's *Sequence*.
 *   5. Declining deletes the asker's row, and **cannot touch any other row**.
 *   6. A withdrawn request stops being pending even though its notification is
 *      still unread — the truth is `tracks`, the arrival is the notification,
 *      and pending needs both.
 *
 * ⚠ **Writes. Development branch only.** The guard below is the one
 * `guarantees.test.ts` and `portal.test.ts` carry, for the same reason.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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

/* Fixtures with the raw driver, so a bug in the data layer cannot arrange the
   conditions its own test needs. `guarantees.test.ts` states the rule. */
const pool = new Pool({ connectionString: url })

type Dal = typeof import('@/lib/db')
let dal: Dal

/** See `guarantees.test.ts`: the brand is satisfied here and nowhere else. */
const asViewer = (id: string) =>
  ({ id, email: `${id}@example.com` }) as unknown as Parameters<Dal['listMyRequests']>[0]

/*
  ⚠ **Every test seeds its own people.** `swipe.mjs` failed on its second run
  against the state its first run left; a suite that shares accounts between
  cases will eventually report a bug that is its own. The names are collected so
  the teardown can find them.
*/
const made: string[] = []
let n = 0

const person = async (label: string) => {
  const handle = `shake${label}${++n}`
  const email = `${handle}@example.com`
  made.push(email)

  const { rows } = await pool.query(
    `insert into "user" (name, email, "emailVerified") values ($1, $2, true)
     on conflict (email) do update set name = excluded.name returning id`,
    [handle, email],
  )
  await pool.query(
    `insert into profiles (id, handle, handle_skeleton, display_name)
     values ($1, $2, $2, $3) on conflict (id) do nothing`,
    [rows[0].id, handle, label],
  )
  return { id: rows[0].id as string, handle }
}

const film = async (externalId: string, title: string) => {
  const { rows } = await pool.query(
    `insert into items (kind, external_source, external_id, title, year)
     values ('film', 'tmdb', $1, $2, 1999)
     on conflict (kind, external_id) do update set title = excluded.title
     returning id`,
    [externalId, title],
  )
  return rows[0].id as string
}

/** A shared, intended, active capture — the only kind that is a signal. */
const capture = async (userId: string, possibilityId: string, text: string) => {
  await pool.query(
    `insert into captures (user_id, text, state, status, intent, visibility, source, possibility_id)
     values ($1, $2, 'want', 'active', 'see', 'mutuals', 'self', $3)`,
    [userId, text, possibilityId],
  )
}

const requestRows = async (userId: string) => {
  const { rows } = await pool.query(
    `select id, read_at, payload from notifications
     where user_id = $1 and kind = 'track_request'`,
    [userId],
  )
  return rows as { id: string; read_at: Date | null; payload: Record<string, unknown> }[]
}

const trackRow = async (followerId: string, followedId: string) => {
  const { rows } = await pool.query(
    'select 1 from tracks where follower_id = $1 and followed_id = $2',
    [followerId, followedId],
  )
  return rows.length > 0
}

let filmId = ''

beforeAll(async () => {
  dal = await import('@/lib/db')
  filmId = await film('handshake-fixture', 'A Handshake Film')
})

afterAll(async () => {
  await pool.query('delete from "user" where email = any($1::text[])', [made])
  await pool.end()
})

describe('the delivery', () => {
  it('writes the other person a request, and grants them nothing', async () => {
    const ada = await person('ada')
    const bo = await person('bo')

    const result = await dal.trackUser(asViewer(ada.id), bo.id)
    expect(result.ok).toBe(true)

    /* The asker's row exists; the answerer's does not. Nothing is mutual. */
    expect(await trackRow(ada.id, bo.id)).toBe(true)
    expect(await trackRow(bo.id, ada.id)).toBe(false)

    const rows = await requestRows(bo.id)
    expect(rows).toHaveLength(1)
    expect(rows[0].read_at).toBeNull()
    expect(rows[0].payload.counterpartId).toBe(ada.id)

    /*
      ⚠ **`@handle`, never a display name.** §5: a name is for people who know
      you, and somebody who has only asked does not yet. The profile above has a
      display name precisely so that this assertion can fail if the rule slips.
    */
    expect(rows[0].payload.counterpartName).toBe(`@${ada.handle}`)

    /* ⚠ No `itemId`: that absence is what keeps a request out of the line read. */
    expect(rows[0].payload.itemId).toBeUndefined()
  })

  it('asks once however many times it is asked', async () => {
    const ada = await person('ada')
    const bo = await person('bo')

    await dal.trackUser(asViewer(ada.id), bo.id)
    await dal.trackUser(asViewer(ada.id), bo.id)
    await dal.trackUser(asViewer(ada.id), bo.id)

    /*
      ⚠ **Idempotent by the CONSTRAINT.** `onConflictDoNothing` on the composite
      primary key is what decides this — the same guarantee that already stops a
      second fan-out, rather than a check somebody could forget.
    */
    expect(await requestRows(bo.id)).toHaveLength(1)
  })
})

describe('the portal', () => {
  it('lights the door, and stays out of the line read', async () => {
    const ada = await person('ada')
    const bo = await person('bo')

    await dal.trackUser(asViewer(ada.id), bo.id)

    const pending = await dal.listMyRequests(asViewer(bo.id))
    expect(pending).toHaveLength(1)
    expect(pending[0].handle).toBe(ada.handle)
    expect(pending[0].sentence).toBe(`@${ada.handle} wants to track you.`)

    /*
      ⚠ **Invisible to `listMyPortal` by construction, not by a filter.** That
      statement inner-joins the viewer's own captures on `payload->>'itemId'`,
      and that join carries the privacy term. A request has no `itemId`.
    */
    expect(await dal.listMyPortal(asViewer(bo.id))).toHaveLength(0)

    /*
      ⚠ **The door knows, and it knows WHICH.** `R` and not `C`: a request needs
      answering and a convergence does not, and a door that said only
      *something* would make the reader open it to find out.
    */
    expect(await dal.portalWaiting(asViewer(bo.id))).toEqual({ lines: false, requests: true })

    /* And the asker's own portal says nothing: asking is not an event for them. */
    expect(await dal.listMyRequests(asViewer(ada.id))).toHaveLength(0)
    expect(await dal.portalWaiting(asViewer(ada.id))).toEqual({ lines: false, requests: false })
  })

  it('is not pending once the asker has withdrawn', async () => {
    const ada = await person('ada')
    const bo = await person('bo')

    await dal.trackUser(asViewer(ada.id), bo.id)
    await dal.untrackUser(asViewer(ada.id), bo.id)

    /*
      ⚠ **The notification is still unread, and the request is still gone.**
      Pending is the arrival AND the truth: a question with nothing left to
      answer must not be asked. This is the case that rules out deriving pending
      from `tracks` alone, and the case that rules out reading the notification
      alone.
    */
    const rows = await requestRows(bo.id)
    expect(rows).toHaveLength(1)
    expect(rows[0].read_at).toBeNull()

    expect(await dal.listMyRequests(asViewer(bo.id))).toHaveLength(0)
    expect(await dal.portalWaiting(asViewer(bo.id))).toEqual({ lines: false, requests: false })
  })
})

describe('answering', () => {
  it('⚠ accepting runs the fan-out — the whole reason this exists', async () => {
    const ada = await person('ada')
    const bo = await person('bo')

    /* Both already hold the same film. This is the seed-time case §13 names. */
    await capture(ada.id, filmId, 'ada wants the handshake film')
    await capture(bo.id, filmId, 'bo wants the handshake film')

    await dal.trackUser(asViewer(ada.id), bo.id)
    expect(await dal.listMyRequests(asViewer(bo.id))).toHaveLength(1)

    /* Accepting IS adding them back. There is no second entry point. */
    const accepted = await dal.trackUser(asViewer(bo.id), ada.id)
    expect(accepted.ok && accepted.value.mutual).toBe(true)

    /*
      ⚠ **The convergence both sides were owed.** Before the handshake this is
      exactly what never happened: two people, one film, no notification.
    */
    const ada_ = await dal.listMyPortal(asViewer(ada.id))
    const bo_ = await dal.listMyPortal(asViewer(bo.id))
    expect(ada_).toHaveLength(1)
    expect(bo_).toHaveLength(1)
    expect(ada_[0].text).toBe('ada wants the handshake film')
    expect(bo_[0].text).toBe('bo wants the handshake film')
    expect(ada_[0].sentence).toMatch(/too\.$/)

    /* The question has been answered, so it leaves — and is marked read. */
    expect(await dal.listMyRequests(asViewer(bo.id))).toHaveLength(0)
    const rows = await requestRows(bo.id)
    expect(rows).toHaveLength(1)
    expect(rows[0].read_at).not.toBeNull()
  })

  it('declining deletes the asker’s row and leaves nothing to answer', async () => {
    const ada = await person('ada')
    const bo = await person('bo')

    await dal.trackUser(asViewer(ada.id), bo.id)

    const declined = await dal.declineTrack(asViewer(bo.id), ada.id)
    expect(declined.ok).toBe(true)

    expect(await trackRow(ada.id, bo.id)).toBe(false)
    expect(await dal.listMyRequests(asViewer(bo.id))).toHaveLength(0)
    expect(await dal.portalWaiting(asViewer(bo.id))).toEqual({ lines: false, requests: false })

    const rows = await requestRows(bo.id)
    expect(rows[0].read_at).not.toBeNull()

    /*
      ⚠ **The asker is not told.** Their state is what it would be for somebody
      they had never asked, which is the whole of §6's silence rule applied
      kindly: a decline and an unanswered request are indistinguishable.
    */
    const asker = await dal.getTrackState(asViewer(ada.id), bo.id)
    expect(asker).toEqual({ outbound: false, inbound: false, mutual: false })
  })

  it('⚠ declining cannot reach a row that does not point at the decliner', async () => {
    const ada = await person('ada')
    const bo = await person('bo')
    const cy = await person('cy')

    /* Ada asks Bo. Cy is a bystander with no relationship to either. */
    await dal.trackUser(asViewer(ada.id), bo.id)

    /*
      ⚠⚠ **THIS IS THE ONLY PLACE IN THE APP WHERE ONE PERSON DELETES ANOTHER
      PERSON'S ROW, AND `followed_id = viewer` IS THE WHOLE SAFETY ARGUMENT.**
      Cy declining Ada must not touch Ada's row pointing at Bo — there is
      deliberately no parameter that could widen the `where`, and this is the
      assertion that says so.
    */
    const result = await dal.declineTrack(asViewer(cy.id), ada.id)
    expect(result.ok).toBe(true)

    expect(await trackRow(ada.id, bo.id)).toBe(true)
    expect(await dal.listMyRequests(asViewer(bo.id))).toHaveLength(1)

    /* And Bo's notification is untouched: it was never Cy's to answer. */
    const rows = await requestRows(bo.id)
    expect(rows[0].read_at).toBeNull()
  })

  it('declining nothing succeeds and changes nothing', async () => {
    const ada = await person('ada')
    const bo = await person('bo')

    const result = await dal.declineTrack(asViewer(bo.id), ada.id)
    expect(result.ok).toBe(true)
    expect(await requestRows(bo.id)).toHaveLength(0)
  })
})
