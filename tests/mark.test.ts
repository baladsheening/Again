/**
 * **The mark — Phase 2 step 4, and the one claim a browser cannot make.**
 *
 * §5 of `docs/re-direction/phase-2-convergence.md` divides the two surfaces in
 * one sentence: *the portal is arrival, the mark is memory.* The portal empties;
 * the mark is what is left when it has. **That is a claim about two reads of one
 * set of rows, and this is where it can actually be proved** — a probe can see
 * a bar in a gutter, but only the database can be asked whether the bar is still
 * there after the row that announced it has gone.
 *
 * What is asserted:
 *
 *   1. A convergence marks **both** sides, each on their own capture.
 *   2. ⚠ **Emptying the portal does not take the mark with it.** The central
 *      claim, and the whole reason the mark's read has no `read_at` term.
 *   3. The sentence names everybody, with no number and no *and 4 others*.
 *   4. It survives the line being settled and crossed off — a resolution is not
 *      an erasure, and the tray and search draw the mark for that reason.
 *   5. ⚠ **Somebody else's capture id answers `null`**, not their convergence.
 *      The capture id arrives from a client; without both terms of that join
 *      this is a door to the counterpart's row (§3).
 *   6. §6's suppression rule holds through it: a copied capture is not marked.
 *
 * ⚠ **Writes. Development branch only.** The guard below is `portal.test.ts`'s,
 * for the same reason.
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

/* The raw driver for fixtures — `guarantees.test.ts` states the rule. */
const pool = new Pool({ connectionString: url })

const A = 'mark-ada'
const B = 'mark-bo'
const C = 'mark-cy'

let adaId = ''
let boId = ''
let cyId = ''
let filmId = ''
let copiedId = ''
let settledFilmId = ''

type Dal = typeof import('@/lib/db')
let dal: Dal

/** See `guarantees.test.ts`: the brand is satisfied here and nowhere else. */
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

const capture = async (
  userId: string,
  possibilityId: string | null,
  text: string,
  {
    state = 'want',
    source = 'self',
    sourceUserId = null,
  }: { state?: string; source?: string; sourceUserId?: string | null } = {},
) => {
  const { rows } = await pool.query(
    `insert into captures (user_id, text, state, intent, visibility, source, source_user_id, possibility_id)
     values ($1, $2, $3, 'see', 'mutuals', $4, $5, $6) returning id`,
    [userId, text, state, source, sourceUserId, possibilityId],
  )
  return rows[0].id as string
}

const trackBoth = async (x: string, y: string) => {
  await pool.query(
    `insert into tracks (follower_id, followed_id) values ($1, $2), ($2, $1)
     on conflict do nothing`,
    [x, y],
  )
}

/** The seed-time trigger, called the way the app calls it — inside a transaction. */
const converge = async (x: { id: string; handle: string }, y: { id: string; handle: string }) => {
  const { runOverlapForNewMutual } = await import('@/lib/overlap')
  const { db } = await import('@/lib/db/client')
  return db.transaction((tx) =>
    runOverlapForNewMutual(
      tx,
      { userId: x.id, handle: x.handle.replace(/-/g, ''), displayName: x.handle },
      { userId: y.id, handle: y.handle.replace(/-/g, ''), displayName: y.handle },
    ),
  )
}

/** One line of somebody's page, by its words. */
const lineOn = async (userId: string, handle: string, text: string) => {
  const page = await dal.listMyPage(viewer(userId, handle))
  return page.find((l) => l.text === text)
}

beforeAll(async () => {
  dal = await import('@/lib/db')

  adaId = await person(A)
  boId = await person(B)
  cyId = await person(C)
  filmId = await film('mark-fixture', 'A Remembered Convergence')
  copiedId = await film('mark-fixture-copied', 'A Copied Want')
  settledFilmId = await film('mark-fixture-settled', 'A Settled Convergence')

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

describe('the mark (Phase 2 step 4)', () => {
  it('marks both sides, each on their own capture', async () => {
    await capture(adaId, filmId, 'ada remembers the convergence film')
    await capture(boId, filmId, 'bo remembers the convergence film')
    await trackBoth(adaId, boId)

    const matches = await converge({ id: adaId, handle: A }, { id: boId, handle: B })
    expect(matches).toHaveLength(2)

    const ada = await lineOn(adaId, A, 'ada remembers the convergence film')
    const bo = await lineOn(boId, B, 'bo remembers the convergence film')

    expect(ada?.converged).toBe(true)
    expect(bo?.converged).toBe(true)
  })

  it('an unresolved capture is not marked, and neither is a resolved one nobody shares', async () => {
    /*
      Two people can only converge on a *possibility* (§13), so a raw capture
      having no mark is the truth rather than a case the read misses. The second
      is the one that proves the join is doing work: it has a possibility, and
      nobody else has written it down.
    */
    await capture(adaId, null, 'ada wrote something raw')
    await capture(adaId, settledFilmId, 'ada alone on the settled film')

    expect((await lineOn(adaId, A, 'ada wrote something raw'))?.converged).toBe(false)
    expect((await lineOn(adaId, A, 'ada alone on the settled film'))?.converged).toBe(false)
  })

  it('names everyone, with no number in it', async () => {
    await capture(cyId, filmId, 'cy remembers the convergence film')
    await trackBoth(adaId, cyId)
    await converge({ id: adaId, handle: A }, { id: cyId, handle: C })

    const line = await lineOn(adaId, A, 'ada remembers the convergence film')
    const sentence = await dal.getConvergence(viewer(adaId, A), line!.id)

    expect(sentence).not.toBeNull()
    expect(sentence).toContain(B)
    expect(sentence).toContain(C)
    /* §5: name everyone. A count is an engagement metric with another name. */
    expect(sentence).not.toMatch(/\d/)
    expect(sentence).not.toMatch(/other/i)
    /* Both still want it, so the tense is "… too." — §5's first row. */
    expect(sentence).toMatch(/too\.$/)
  })

  it('⚠ SURVIVES THE PORTAL EMPTYING — the portal is arrival, the mark is memory', async () => {
    const portal = await dal.listMyPortal(viewer(adaId, A))
    const row = portal.find((l) => l.text === 'ada remembers the convergence film')
    expect(row).toBeDefined()

    await dal.readPortalLine(viewer(adaId, A), row!.notificationIds)

    /* The portal has forgotten it. */
    const after = await dal.listMyPortal(viewer(adaId, A))
    expect(after.some((l) => l.text === 'ada remembers the convergence film')).toBe(false)

    /*
      ⚠ **The record has not.** This one assertion is the whole difference
      between the two reads: `listMyPortal` filters `read_at is null` and this
      does not. If a `read_at` term is ever added to `converged` in
      `captures.ts`, this is what fails — and what it means is that the app has
      lost the only durable record that a convergence happened.
    */
    const line = await lineOn(adaId, A, 'ada remembers the convergence film')
    expect(line?.converged).toBe(true)
    expect(await dal.getConvergence(viewer(adaId, A), line!.id)).toContain(B)

    /* And the door is dark, because the portal is what empties. */
    expect(await dal.hasPortalLines(viewer(adaId, A))).toBe(false)
  })

  it('survives being crossed off, and follows the line into the tray', async () => {
    const live = await lineOn(adaId, A, 'ada remembers the convergence film')
    await pool.query(`update captures set state = 'dropped' where id = $1`, [live!.id])

    /* Struck lines stay on the page (§5), and a resolution is not an erasure. */
    const struck = await lineOn(adaId, A, 'ada remembers the convergence film')
    expect(struck?.state).toBe('dropped')
    expect(struck?.converged).toBe(true)

    /*
      And settled: the tray's read carries the same expression, which is why the
      tray draws the mark. `resolved_at` is what orders that surface.
    */
    await pool.query(
      `update captures set state = 'done', resolved_at = now() where id = $1`,
      [live!.id],
    )
    const settled = await dal.listMySettled(viewer(adaId, A))
    const row = settled.find((l) => l.text === 'ada remembers the convergence film')
    expect(row?.converged).toBe(true)

    /* Search is the third read of the same expression. */
    const found = await dal.searchMyCaptures(viewer(adaId, A), { q: 'convergence film' })
    expect(found.find((l) => l.text === 'ada remembers the convergence film')?.converged).toBe(
      true,
    )
  })

  it('will not tell you who converged on somebody else’s capture', async () => {
    const bo = await lineOn(boId, B, 'bo remembers the convergence film')
    expect(bo?.converged).toBe(true)

    /*
      ⚠ **The id is real and it is not Ada's.** `getConvergence` joins on the
      capture being the viewer's *and* the notification being theirs; without the
      first term this is *tell me who converged on any capture id you can guess*
      — a notification that only ever named a counterpart turned into a door to
      their row (§3).
    */
    expect(await dal.getConvergence(viewer(adaId, A), bo!.id)).toBeNull()
  })

  it('a copied capture is not marked — §6’s suppression rule, on the record', async () => {
    await capture(adaId, copiedId, 'ada wrote the copied one first')
    await capture(cyId, copiedId, 'cy copied it off ada', {
      source: 'copy',
      sourceUserId: adaId,
    })
    await converge({ id: adaId, handle: A }, { id: cyId, handle: C })

    /*
      A received list is not an independent common intention, so there is no
      notification — and with no notification there is nothing for the mark to
      read. **The suppression rule is enforced once, in the write, and every
      surface inherits it for free.**
    */
    const line = await lineOn(adaId, A, 'ada wrote the copied one first')
    expect(line?.converged).toBe(false)
    expect(await dal.getConvergence(viewer(adaId, A), line!.id)).toBeNull()
  })
})
