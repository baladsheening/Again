/**
 * **The fan-out, end to end, with two accounts — for the first time.**
 *
 * `lib/overlap.ts` has been deployed and running since Phase 2's engine landed
 * and **nothing has ever read what it wrote.** Phase 2 step 3 says the portal is
 * what proves it; this is that proof, at the layer where it can actually be
 * made. A browser cannot be driven into a convergence quickly — it needs two
 * accounts, a mutual track and two captures resolved to one possibility — and
 * the surface is measured separately by `node_modules/.probe/portal.mjs`.
 *
 * What is asserted is the whole chain in one place:
 *
 *   1. Two people who already hold matching wants, who then start tracking each
 *      other, produce notifications — `runOverlapForNewMutual`, the seed-time
 *      trigger, which is the case the entry-side fan-out misses.
 *   2. Each side's portal is built out of **their own** capture, never the
 *      counterpart's.
 *   3. Two counterparts on one line is **one row naming both**, which is §5's
 *      *a list of lines, not a list of events*.
 *   4. Opening a line empties it, and only for the person who opened it.
 *   5. **The suppression rule holds through all of it** — the most important
 *      line in the app (§6). A copied capture converges with nobody.
 *
 * ⚠ **Writes. Development branch only.** The guard below is not a courtesy —
 * it is the same one `guarantees.test.ts` carries, for the same reason.
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

/*
  Fixtures with the raw driver, so a bug in the data layer cannot quietly arrange
  the conditions its own test needs. `guarantees.test.ts` states the rule.
*/
const pool = new Pool({ connectionString: url })

const A = 'portal-ada'
const B = 'portal-bo'
const C = 'portal-cy'

let adaId = ''
let boId = ''
let cyId = ''
let filmId = ''
let otherFilmId = ''

type Dal = typeof import('@/lib/db')
let dal: Dal

/** See `guarantees.test.ts`: the brand is satisfied here and nowhere else. */
const asViewer = (id: string, email: string) =>
  ({ id, email }) as unknown as Parameters<Dal['listMyPortal']>[0]

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

/** A shared, intended capture — the only kind that is a signal to anybody. */
const capture = async (
  userId: string,
  possibilityId: string,
  text: string,
  {
    state = 'want',
    intent = 'see',
    source = 'self',
    sourceUserId = null,
  }: { state?: string; intent?: string; source?: string; sourceUserId?: string | null } = {},
) => {
  const { rows } = await pool.query(
    `insert into captures (user_id, text, state, status, verdict, intent, visibility, source, source_user_id, possibility_id)
     values ($1, $2, $3, (case $3 when 'want' then 'active' when 'dropped' then 'dropped' else 'completed' end), (case $3 when 'go_back_to' then 'again' when 'fixture' then 'have' end), $4, 'mutuals', $5, $6, $7) returning id`,
    [userId, text, state, intent, source, sourceUserId, possibilityId],
  )
  return rows[0].id as string
}

/** Both directions, which is what makes a track mutual. */
const trackBoth = async (x: string, y: string) => {
  await pool.query(
    `insert into tracks (follower_id, followed_id) values ($1, $2), ($2, $1)
     on conflict do nothing`,
    [x, y],
  )
}

beforeAll(async () => {
  dal = await import('@/lib/db')

  adaId = await person(A)
  boId = await person(B)
  cyId = await person(C)
  filmId = await film('portal-fixture', 'A Convergence')
  otherFilmId = await film('portal-fixture-copied', 'A Copied Want')

  const everyone = [adaId, boId, cyId]
  await pool.query('delete from notifications where user_id = any($1::uuid[])', [everyone])
  await pool.query('delete from captures where user_id = any($1::uuid[])', [everyone])
  await pool.query('delete from tracks where follower_id = any($1::uuid[])', [everyone])
})

afterAll(async () => {
  await pool.query('delete from "user" where email = any($1::text[])', [
    [`${A}@example.com`, `${B}@example.com`, `${C}@example.com`],
  ])
  await pool.end()
})

describe('the fan-out reaches a surface (Phase 2 step 3)', () => {
  it('converges two people, and each portal is built from their own capture', async () => {
    await capture(adaId, filmId, 'ada wants the convergence film')
    await capture(boId, filmId, 'bo wants the convergence film')

    /*
      The seed-time trigger: both wants already exist, and the track becoming
      mutual is what fires. Called inside a transaction because that is how the
      app calls it — §10, and `runOverlap`'s own note.
    */
    await trackBoth(adaId, boId)
    const { runOverlapForNewMutual } = await import('@/lib/overlap')
    const { db } = await import('@/lib/db/client')
    const matches = await db.transaction((tx) =>
      runOverlapForNewMutual(
        tx,
        { userId: adaId, handle: A.replace(/-/g, ''), displayName: A },
        { userId: boId, handle: B.replace(/-/g, ''), displayName: B },
      ),
    )

    /* want·see × want·see is a convergence, and it notifies BOTH sides. */
    expect(matches).toHaveLength(2)
    expect(matches.every((m) => m.kind === 'convergence')).toBe(true)

    const ada = await dal.listMyPortal(asViewer(adaId, `${A}@example.com`))
    const bo = await dal.listMyPortal(asViewer(boId, `${B}@example.com`))

    expect(ada).toHaveLength(1)
    expect(bo).toHaveLength(1)

    /*
      ⚠ **The line each of them sees is their OWN.** A notification names a
      counterpart; it must never be a door to the counterpart's row, and this is
      the assertion that says so.
    */
    expect(ada[0].text).toBe('ada wants the convergence film')
    expect(bo[0].text).toBe('bo wants the convergence film')

    /* The tense is the product — §5. Both still want it, so: "… too." */
    expect(ada[0].sentence).toMatch(/too\.$/)
    expect(ada[0].sentence).toContain(B)
    expect(bo[0].sentence).toContain(A)
  })

  it('is a list of LINES: two counterparts on one capture is one row naming both', async () => {
    await capture(cyId, filmId, 'cy wants the convergence film')
    await trackBoth(adaId, cyId)

    const { runOverlapForNewMutual } = await import('@/lib/overlap')
    const { db } = await import('@/lib/db/client')
    await db.transaction((tx) =>
      runOverlapForNewMutual(
        tx,
        { userId: adaId, handle: A.replace(/-/g, ''), displayName: A },
        { userId: cyId, handle: C.replace(/-/g, ''), displayName: C },
      ),
    )

    const ada = await dal.listMyPortal(asViewer(adaId, `${A}@example.com`))

    /* Two events, one line — which is the whole shape decision in §5. */
    expect(ada).toHaveLength(1)
    expect(ada[0].notificationIds.length).toBe(2)
    expect(ada[0].sentence).toContain(B)
    expect(ada[0].sentence).toContain(C)
    /* Everyone is named, and there is no number anywhere in it. */
    expect(ada[0].sentence).not.toMatch(/\d/)
    expect(ada[0].sentence).not.toMatch(/other/i)
  })

  it('empties when a line is opened, and only for the person who opened it', async () => {
    const ada = await dal.listMyPortal(asViewer(adaId, `${A}@example.com`))
    expect(ada).toHaveLength(1)

    await dal.readPortalLine(asViewer(adaId, `${A}@example.com`), ada[0].notificationIds)

    expect(await dal.listMyPortal(asViewer(adaId, `${A}@example.com`))).toHaveLength(0)
    expect(await dal.hasPortalLines(asViewer(adaId, `${A}@example.com`))).toBe(false)

    /* Bo's side of the same convergence is untouched. */
    expect(await dal.hasPortalLines(asViewer(boId, `${B}@example.com`))).toBe(true)
  })

  it('will not empty somebody else’s rows', async () => {
    const bo = await dal.listMyPortal(asViewer(boId, `${B}@example.com`))
    expect(bo).toHaveLength(1)

    /*
      ⚠ **The ids are real and they are not Ada's.** Without the `user_id` term
      in the update this is an endpoint for marking other people's notifications
      read — not a leak, and exactly the class of quiet damage §3 says this layer
      exists to prevent.
    */
    await dal.readPortalLine(asViewer(adaId, `${A}@example.com`), bo[0].notificationIds)

    expect(await dal.listMyPortal(asViewer(boId, `${B}@example.com`))).toHaveLength(1)
  })

  it('a copied capture converges with nobody, and the portal stays empty', async () => {
    /*
      §6's suppression rule, seen from the surface for the first time. Cy copied
      this off Ada's page, so Ada is the source — telling her she matches her own
      list is the noise the rule exists to prevent.
    */
    await capture(adaId, otherFilmId, 'ada wrote the copied one first')
    await capture(cyId, otherFilmId, 'cy copied it off ada', {
      source: 'copy',
      sourceUserId: adaId,
    })

    const before = await dal.listMyPortal(asViewer(adaId, `${A}@example.com`))

    const { runOverlapForNewMutual } = await import('@/lib/overlap')
    const { db } = await import('@/lib/db/client')
    const matches = await db.transaction((tx) =>
      runOverlapForNewMutual(
        tx,
        { userId: adaId, handle: A.replace(/-/g, ''), displayName: A },
        { userId: cyId, handle: C.replace(/-/g, ''), displayName: C },
      ),
    )

    /*
      The convergence film converges again — that pair is independent and the
      trigger is uncapped by design — but the copied one produces nothing.
    */
    expect(matches.every((m) => m.kind === 'convergence')).toBe(true)

    const after = await dal.listMyPortal(asViewer(adaId, `${A}@example.com`))
    expect(after.some((l) => l.text === 'ada wrote the copied one first')).toBe(false)
    expect(before.some((l) => l.text === 'ada wrote the copied one first')).toBe(false)
  })
})
