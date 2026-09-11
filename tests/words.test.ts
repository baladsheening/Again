/**
 * **A capture converges on its words — Amendment 4, and it is the half a
 * browser cannot reach.**
 *
 * Until this, `lib/overlap.ts` joined on `possibility_id` alone, so two people
 * could converge on a film and on nothing else — and most captures never
 * resolve. An ambition never will: no external id, no catalogue, no year. The
 * words are the only handle those two people have in common, and this is where
 * it can be proved, because driving a browser into a convergence takes two
 * accounts and a fan-out nobody can see happen.
 *
 * What is asserted:
 *
 *   1. Two people who wrote the same words, neither resolved, converge — and
 *      both are marked, each on their own line.
 *   2. **Exactness.** *learn to sail* and *learn to surf* are not a match. This
 *      is the sparsity the strategy accepts in exchange for never making a
 *      false claim about a third party.
 *   3. Case, punctuation and spacing do not matter, because `normalised_text`
 *      is a generated column and this is its rule doing the work.
 *   4. ⚠ **A crossed-off line converges with nobody.** `classify` is an
 *      allowlist and the fourth rule had to keep it one — `isUnclassified`
 *      demands `active` exactly as `isWantSee` does.
 *   5. ⚠ **Each side is told its OWN words.** They normalise to one string and
 *      may not be spelled alike; a standalone line quoting somebody else's
 *      spelling of your own capture reads as the app quoting them.
 *   6. ⚠⚠ **A pair that resolved to the same possibility AND wrote the same
 *      words is announced ONCE.** The two subjects are mutually exclusive by
 *      construction, and this module deliberately does not deduplicate — so
 *      without that term the pair would be told twice about one agreement.
 *   7. ⚠⚠ **Words that normalise to nothing converge with nobody.** `???` and
 *      `...` both normalise to the empty string; without the guard every junk
 *      capture in the app would match every other one.
 *   8. ⚠ **§6's suppression rule holds on this path too** — a capture copied
 *      from the counterpart is not an independent common intention, whether it
 *      matched on a possibility or on its words.
 *   9. A private capture converges with nobody.
 *  10. ⚠ **An edit is the fourth moment.** A typo fixed is the commonest route
 *      into a match; an edit that does not change the *normalised* text is not
 *      a new signal and must not fan out again.
 *
 * ⚠ **Writes. Development branch only.** The guard below is `mark.test.ts`'s,
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

const pool = new Pool({ connectionString: url })

const A = 'words-ada'
const B = 'words-bo'

let adaId = ''
let boId = ''
let filmId = ''

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

/**
 * ⚠ **`intent` defaults to NULL here, where `mark.test.ts` hardcodes `'see'`.**
 * That is not a stylistic difference: `addCapture` writes `input.intent ?? null`
 * and nothing on the composer supplies one, so **a real unresolved capture has
 * no intention** — and the fourth rule in `classify` is gated on exactly that.
 * A fixture with an intent would exercise the *first* rule instead and prove
 * nothing about this amendment.
 */
const capture = async (
  userId: string,
  text: string,
  {
    possibilityId = null,
    status = 'active',
    visibility = 'mutuals',
    intent = null,
    source = 'self',
    sourceUserId = null,
  }: {
    possibilityId?: string | null
    status?: string
    visibility?: string
    intent?: string | null
    source?: string
    sourceUserId?: string | null
  } = {},
) => {
  const { rows } = await pool.query(
    `insert into captures
       (user_id, text, state, status, intent, visibility, source, source_user_id, possibility_id)
     values ($1, $2, (case $3 when 'active' then 'want' else 'dropped' end), $3, $4, $5, $6, $7, $8)
     returning id`,
    [userId, text, status, intent, visibility, source, sourceUserId, possibilityId],
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
const converge = async () => {
  const { runOverlapForNewMutual } = await import('@/lib/overlap')
  const { db } = await import('@/lib/db/client')
  return db.transaction((tx) =>
    runOverlapForNewMutual(
      tx,
      { userId: adaId, handle: A.replace(/-/g, ''), displayName: A },
      { userId: boId, handle: B.replace(/-/g, ''), displayName: B },
    ),
  )
}

/** One line of somebody's page, by its words. */
const lineOn = async (userId: string, handle: string, text: string) => {
  const page = await dal.listMyPage(viewer(userId, handle))
  return page.find((l) => l.text === text)
}

const payloads = async (userId: string) => {
  const { rows } = await pool.query(
    `select kind, payload from notifications where user_id = $1 order by created_at`,
    [userId],
  )
  return rows as { kind: string; payload: Record<string, unknown> }[]
}

/** Everything either account holds, so each case starts from nothing. */
const wipe = async () => {
  const both = [adaId, boId]
  await pool.query('delete from notifications where user_id = any($1::uuid[])', [both])
  await pool.query('delete from captures where user_id = any($1::uuid[])', [both])
}

beforeAll(async () => {
  dal = await import('@/lib/db')

  adaId = await person(A)
  boId = await person(B)
  filmId = await film('words-fixture', 'A Film Both Also Typed')

  await pool.query('delete from tracks where follower_id = any($1::uuid[])', [[adaId, boId]])
  await wipe()
  await trackBoth(adaId, boId)
})

afterAll(async () => {
  await pool.query('delete from "user" where email = any($1::text[])', [
    [`${A}@example.com`, `${B}@example.com`],
  ])
  await pool.end()
})

describe('convergence on words (Amendment 4)', () => {
  it('two people who wrote the same words converge, and both are marked', async () => {
    await wipe()
    await capture(adaId, 'learn to sail')
    await capture(boId, 'learn to sail')

    const matches = await converge()
    expect(matches).toHaveLength(2)
    expect(matches.every((m) => m.kind === 'convergence')).toBe(true)

    expect((await lineOn(adaId, A, 'learn to sail'))?.converged).toBe(true)
    expect((await lineOn(boId, B, 'learn to sail'))?.converged).toBe(true)
  })

  it('the portal shows it, and the sentence names the other person', async () => {
    await wipe()
    await capture(adaId, 'learn to sail')
    await capture(boId, 'learn to sail')
    await converge()

    const portal = await dal.listMyPortal(viewer(adaId, A))
    expect(portal).toHaveLength(1)
    expect(portal[0].text).toBe('learn to sail')
    expect(portal[0].sentence).toContain(B)

    const line = await lineOn(adaId, A, 'learn to sail')
    expect(await dal.getConvergence(viewer(adaId, A), line!.id)).toContain(B)
  })

  it('different words are not a match, however close they read', async () => {
    await wipe()
    await capture(adaId, 'learn to sail')
    await capture(boId, 'learn to surf')

    expect(await converge()).toHaveLength(0)
    expect((await lineOn(adaId, A, 'learn to sail'))?.converged).toBe(false)
  })

  it('case, punctuation and spacing do not matter', async () => {
    await wipe()
    await capture(adaId, 'Learn to sail!')
    await capture(boId, '  learn   to  sail ')

    expect(await converge()).toHaveLength(2)
  })

  it('one side having stated an intention does not block the match', async () => {
    await wipe()
    await capture(adaId, 'learn to sail', { intent: 'see' })
    await capture(boId, 'learn to sail')

    /*
      ⚠ **Amendment 4: *where either is null it is the plain one*.** A capture
      with an intention and no resolution is rare but reachable, and neither the
      three intent rules nor a both-null gate would answer this pair — so
      without the `||` these two write the same words and are told nothing.
    */
    expect(await converge()).toHaveLength(2)
  })

  it('a crossed-off line converges with nobody', async () => {
    await wipe()
    await capture(adaId, 'learn to sail', { status: 'dropped' })
    await capture(boId, 'learn to sail')

    expect(await converge()).toHaveLength(0)
  })

  it('a private line converges with nobody', async () => {
    await wipe()
    await capture(adaId, 'learn to sail', { visibility: 'private' })
    await capture(boId, 'learn to sail')

    expect(await converge()).toHaveLength(0)
  })

  it('each side is told its own words', async () => {
    await wipe()
    await capture(adaId, 'Learn to sail')
    await capture(boId, 'learn to sail!')
    await converge()

    const [ada] = await payloads(adaId)
    const [bo] = await payloads(boId)

    expect(ada.payload.title).toBe('Learn to sail')
    expect(bo.payload.title).toBe('learn to sail!')
    /* One subject, one normalised handle, and no `itemId` on either. */
    expect(ada.payload.normalisedText).toBe('learn to sail')
    expect(bo.payload.normalisedText).toBe('learn to sail')
    expect(ada.payload.itemId).toBeUndefined()
  })

  it('the same possibility AND the same words is announced once', async () => {
    await wipe()
    await capture(adaId, 'A Film Both Also Typed', { possibilityId: filmId, intent: 'see' })
    await capture(boId, 'A Film Both Also Typed', { possibilityId: filmId, intent: 'see' })

    /*
      ⚠ **Two, not four.** Both legs of the union could see this pair — they
      resolved to one possibility and typed one string — and the words leg's
      `possibility_id is null` is the only thing standing between the reader and
      being told twice about one agreement.
    */
    expect(await converge()).toHaveLength(2)
    expect(await payloads(adaId)).toHaveLength(1)
    expect((await payloads(adaId))[0].payload.itemId).toBe(filmId)
  })

  it('words that normalise to nothing converge with nobody', async () => {
    await wipe()
    await capture(adaId, '???')
    await capture(boId, '...')

    /*
      Both normalise to the empty string, so without the guard these two would
      match — and so would every other punctuation-only capture in the app.
    */
    expect(await converge()).toHaveLength(0)
  })

  it('a copy of the counterpart’s capture is suppressed', async () => {
    await wipe()
    await capture(adaId, 'learn to sail')
    await capture(boId, 'learn to sail', { source: 'copy', sourceUserId: adaId })

    /* §6's most important line, reached through the words rather than an id. */
    expect(await converge()).toHaveLength(0)
  })

  describe('an edit is the fourth moment', () => {
    it('fixing a typo into a match announces it', async () => {
      await wipe()
      const typo = await capture(adaId, 'learn to sial')
      await capture(boId, 'learn to sail')

      /* Nothing yet — the words do not agree. */
      expect(await converge()).toHaveLength(0)

      const result = await dal.setCaptureText(viewer(adaId, A), typo, 'learn to sail')
      expect(result.ok).toBe(true)

      expect((await lineOn(adaId, A, 'learn to sail'))?.converged).toBe(true)
      expect((await lineOn(boId, B, 'learn to sail'))?.converged).toBe(true)
    })

    it('an edit that does not change the normalised text announces nothing', async () => {
      await wipe()
      const line = await capture(adaId, 'learn to sail')
      await capture(boId, 'learn to sail')
      await converge()

      const before = (await payloads(boId)).length
      await dal.setCaptureText(viewer(adaId, A), line, 'Learn to sail!')

      /* Same normalised string, so not a signal it was not already. */
      expect((await payloads(boId)).length).toBe(before)
    })
  })
})
