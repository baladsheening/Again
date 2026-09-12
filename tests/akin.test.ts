/**
 * **Akin — the asterisk and its grouping, 12 September, directed.**
 *
 * *If it's semantically similar enough, it should be added but with an
 * asterisk, and when the user taps the semantically similar entries, they see a
 * grouping of them in the console.*
 *
 * ⚠⚠ **THE VECTORS ARE WRITTEN BY HAND AND NOT BY VOYAGE, AND THAT IS THE ONLY
 * WAY THIS CAN BE A TEST.** Embedding is a paid third-party call: driving it
 * here would make the suite cost money, need a key on every machine that runs
 * it, and depend on somebody else's uptime to go green. **What is Voyage's job
 * is producing the numbers; what is OURS is everything after them** — the
 * threshold, the pair being written both ways, the owner never being crossed,
 * the bit on the record, and the grouping behind the tap. All of that is
 * testable against vectors a person can reason about, and none of it is
 * testable against vectors nobody can predict.
 *
 * ⚠ **`lib/embed.ts` is what is NOT covered here**, deliberately: it is one
 * `fetch` and a shape check, and a test of it would be a test of a mock.
 *
 * ⚠ **The vectors are 1024 wide because the column is.** A short one is
 * rejected by Postgres, which is the check `lib/akin.ts` makes in TypeScript one
 * layer up.
 *
 * ⚠ **Writes. Development branch only.** The guard is `portal.test.ts`'s.
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

const pool = new Pool({ connectionString: url })

const A = 'akin-ada'
const B = 'akin-bo'

let adaId = ''
let boId = ''

type Dal = typeof import('@/lib/db')
let dal: Dal

const asViewer = (id: string, email: string) =>
  ({ id, email }) as unknown as Parameters<Dal['listMyPage']>[0]

const viewer = (id: string, handle: string) => asViewer(id, `${handle}@example.com`)

const person = async (handle: string) => {
  const { rows } = await pool.query(
    `insert into "user" (name, email, "emailVerified") values ($1, $2, true)
     on conflict (email) do update set name = excluded.name returning id`,
    [handle, `${handle}@example.com`],
  )
  await pool.query(
    `insert into profiles (id, handle, handle_skeleton, display_name)
     values ($1, $2, $2, $3) on conflict (id) do nothing`,
    [rows[0].id, handle.replace(/-/g, ''), handle],
  )
  return rows[0].id as string
}

/**
 * **A unit vector pointing mostly along one axis, leaning `tilt` toward the
 * next.** Two of these with the same `axis` are near each other and two with
 * different axes are as far apart as this space allows — which is all the
 * geometry these cases need, and it is exactly reproducible.
 */
const unit = (axis: number, tilt = 0) => {
  const v = new Array(1024).fill(0)
  v[axis] = 1
  v[(axis + 1) % 1024] = tilt
  const norm = Math.hypot(1, tilt)
  return v.map((n) => n / norm)
}

const literal = (v: number[]) => `[${v.join(',')}]`

/** A capture with a vector already on it, as if `lib/akin.ts` had embedded it. */
const capture = async (userId: string, text: string, vector: number[] | null) => {
  const { rows } = await pool.query(
    `insert into captures (user_id, text, state, status, intent, visibility, source, embedding)
     values ($1, $2, 'want', 'active', 'see', 'mutuals', 'self', $3::vector) returning id`,
    [userId, text, vector ? literal(vector) : null],
  )
  return rows[0].id as string
}

const lineOn = async (userId: string, handle: string, text: string) => {
  const page = await dal.listMyPage(viewer(userId, handle))
  return page.find((l) => l.text === text)
}

let writeAkin: (id: string) => Promise<void>

beforeAll(async () => {
  dal = await import('@/lib/db')
  ;({ writeAkin } = await import('@/lib/akin'))

  adaId = await person(A)
  boId = await person(B)

  await pool.query('delete from captures where user_id = any($1::uuid[])', [[adaId, boId]])
})

afterAll(async () => {
  await pool.query('delete from "user" where email = any($1::text[])', [
    [`${A}@example.com`, `${B}@example.com`],
  ])
  await pool.end()
})

/**
 * ⚠ **`writeAkin` cannot run here — it would call Voyage.** Every case below
 * writes the pairs the way that function does, through the same SQL shape, and
 * then asserts what the app reads back. The one thing that is asserted about
 * `writeAkin` itself is that **it does nothing at all without a key**, which is
 * the state the app ships in.
 */
const pair = async (a: string, b: string, distance: number) => {
  await pool.query(
    `insert into capture_akin (capture_id, akin_id, distance)
     values ($1, $2, $3), ($2, $1, $3) on conflict do nothing`,
    [a, b, distance],
  )
}

describe('akin — the bit on the record', () => {
  it('a line with a near twin is marked, and one without is not', async () => {
    const sail = await capture(adaId, 'learn to sail', unit(0))
    const lessons = await capture(adaId, 'sailing lessons', unit(0, 0.2))
    await capture(adaId, 'read more history', unit(500))

    await pair(sail, lessons, 0.02)

    expect((await lineOn(adaId, A, 'learn to sail'))?.akin).toBe(true)
    expect((await lineOn(adaId, A, 'sailing lessons'))?.akin).toBe(true)
    expect((await lineOn(adaId, A, 'read more history'))?.akin).toBe(false)
  })
})

describe('akin — the grouping behind the tap', () => {
  it('hands back the other line, and the other line hands back this one', async () => {
    const sail = (await lineOn(adaId, A, 'learn to sail'))!
    const lessons = (await lineOn(adaId, A, 'sailing lessons'))!

    const fromSail = await dal.getAkin(viewer(adaId, A), sail.id)
    expect(fromSail.map((l) => l.text)).toEqual(['sailing lessons'])

    /*
      ⚠ **The symmetry is the point of storing both directions.** A grouping is
      always relative to the line you tapped — see `capture_akin` in
      `schema.ts` for why that is pairs rather than a group id.
    */
    const fromLessons = await dal.getAkin(viewer(adaId, A), lessons.id)
    expect(fromLessons.map((l) => l.text)).toEqual(['learn to sail'])
  })

  it('⚠ WILL NOT HAND BACK SOMEBODY ELSE’S LINES, WHICH IS THE WHOLE PRIVACY OF IT', async () => {
    const mine = await capture(adaId, 'ada writes about boats', unit(3))
    const theirs = await capture(boId, 'bo writes about boats', unit(3, 0.01))

    /*
      A pair that should never exist, written by hand so the READ is what is
      being tested. `lib/akin.ts` cannot produce this — it scopes its search to
      the owner of the capture it was given — but the capture id reaching
      `getAkin` comes from a client, and a join without the session term on
      **both** ends is a door onto a stranger's record (§3).
    */
    await pair(mine, theirs, 0.01)

    expect(await dal.getAkin(viewer(adaId, A), mine)).toEqual([])
    /* And asking as the wrong person about a real line answers nothing at all. */
    expect(await dal.getAkin(viewer(boId, B), mine)).toEqual([])
  })

  it('⚠ a CROSSED-OFF line is neither marked nor listed', async () => {
    const here = await capture(adaId, 'a line that will be struck', unit(7))
    const there = await capture(adaId, 'a line that stays', unit(7, 0.05))
    await pair(here, there, 0.03)

    expect((await lineOn(adaId, A, 'a line that stays'))?.akin).toBe(true)
    expect((await dal.getAkin(viewer(adaId, A), there)).map((l) => l.text)).toEqual([
      'a line that will be struck',
    ])

    await pool.query(
      `update captures set state = 'dropped', status = 'dropped' where id = $1`,
      [here],
    )

    /*
      ⚠ **Both ends, and that is the rule the mark took the same day.** A line
      with a rule through it is one you have already answered: its own asterisk
      goes, and it stops appearing in anybody else's grouping. The BIT on the
      live line stays `true` — the pair is still there — and the console is what
      shows nothing, which is §6's silence rather than a disagreement.
    */
    expect((await lineOn(adaId, A, 'a line that will be struck'))?.akin).toBe(true)
    expect(await dal.getAkin(viewer(adaId, A), here)).toEqual([])
    expect(await dal.getAkin(viewer(adaId, A), there)).toEqual([])
  })
})

describe('akin — without a key', () => {
  it('⚠ WRITES NOTHING AT ALL, WHICH IS THE STATE THE APP SHIPS IN', async () => {
    /*
      ⚠ **This is the assertion that says the feature is dark rather than
      broken.** `VOYAGE_API_KEY` is optional in `lib/env.ts` on the VAPID keys'
      precedent: with no key nothing is embedded, no pair is written, no
      asterisk is drawn, and **no screen says anything is missing** (§6). If
      this ever fails it means a capture write started reaching for the network
      on a machine that has no credentials for it.
    */
    if (process.env.VOYAGE_API_KEY) return

    const lonely = await capture(adaId, 'nothing will be embedded here', null)
    await writeAkin(lonely)

    const { rows } = await pool.query(
      'select embedding is null as bare from captures where id = $1',
      [lonely],
    )
    expect(rows[0].bare).toBe(true)
    expect((await lineOn(adaId, A, 'nothing will be embedded here'))?.akin).toBe(false)
  })
})
