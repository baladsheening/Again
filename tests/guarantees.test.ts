/**
 * The guarantees that fail without a symptom (§13).
 *
 * Three of them, and they are the only things tested in this repository:
 *
 *   1. Another person's private entries — `done` and `dropped` — are never
 *      returned.
 *   2. The private `note` never reaches a public projection.
 *   3. `getSwap` withholds each side's picks until both have committed.
 *
 * What they share is that nothing breaks when they break. No error, no failing
 * build, no screen that looks wrong — just somebody's archive on their page, or
 * their note, or a swap they can see through. Everything else about this app is
 * verified by driving it in a browser, which is where every fault that mattered
 * was actually found.
 *
 * ⚠ **Writes. Development branch only.** The guard below is not a courtesy.
 */
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

/*
  Fixtures are written with the raw driver rather than through the data layer, so
  that a bug in the layer cannot quietly arrange the conditions its own test needs.
*/
const pool = new Pool({ connectionString: url })

const OWNER = 'guarantee-owner'
const VIEWER = 'guarantee-viewer'

let ownerId = ''
let viewerId = ''
let itemId = ''
/* `entries` is unique on (user, item, intent) and this file uses both of the
   film intents on `itemId`, so the dropped case needs a film of its own. */
let droppedItemId = ''

/** Whatever the data layer exports, imported the way the app imports it. */
type Dal = typeof import('@/lib/db')
let dal: Dal

/**
 * A `SessionUser` cannot be fabricated — its constructor is private to
 * `lib/db/session.ts`, which is the point of it. The tests exercise the functions
 * that take one, so the brand is satisfied with a cast **here and nowhere else**;
 * doing it in application code would defeat §3's second pillar.
 */
const asViewer = (id: string, email: string) =>
  ({ id, email }) as unknown as Parameters<Dal['listEntriesForOtherUser']>[0]

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

  ownerId = await person(OWNER)
  viewerId = await person(VIEWER)

  const { rows } = await pool.query(
    `insert into items (kind, external_source, external_id, title, year)
     values ('film', 'tmdb', 'guarantee-fixture', 'A Fixture', 1999)
     on conflict (kind, external_id) do update set title = excluded.title
     returning id`,
  )
  itemId = rows[0].id

  const dropped = await pool.query(
    `insert into items (kind, external_source, external_id, title, year)
     values ('film', 'tmdb', 'guarantee-dropped', 'A Lapsed Want', 2001)
     on conflict (kind, external_id) do update set title = excluded.title
     returning id`,
  )
  droppedItemId = dropped.rows[0].id

  await pool.query('delete from captures where user_id = any($1::uuid[])', [[ownerId, viewerId]])
  await pool.query('delete from entries where user_id = any($1::uuid[])', [[ownerId, viewerId]])
})

afterAll(async () => {
  await pool.query('delete from "user" where email = any($1::text[])', [
    [`${OWNER}@example.com`, `${VIEWER}@example.com`],
  ])
  await pool.end()
})

describe('another user’s private entries are never visible (§5.3)', () => {
  it('excludes state = done from every public view', async () => {
    await pool.query(
      `insert into entries (user_id, item_id, intent, state) values ($1, $2, 'see', 'done')`,
      [ownerId, itemId],
    )

    const viewer = asViewer(viewerId, `${VIEWER}@example.com`)

    for (const view of ['live', 'go_back_tos', 'fixtures'] as const) {
      const rows = await dal.listEntriesForOtherUser(viewer, ownerId, view)
      expect(rows.some((r) => r.entry.state === 'done')).toBe(false)
    }

    // And the owner does see it, so the exclusion is the visibility rule rather
    // than the row having failed to be written.
    const own = await dal.listMyEntries(asViewer(ownerId, `${OWNER}@example.com`), 'archive')
    expect(own.some((r) => r.entry.state === 'done')).toBe(true)
  })

  /*
    The same guarantee for the state added on 21 August, and the reason this test
    exists at all: `listEntriesForOtherUser` excluded `done` **by name** until
    then, so a new private state was public the moment it was added — no error,
    no failing build, nothing on screen to notice. The filter is positive now
    (`PUBLIC_STATES`), and this is what says so.

    `live` matters most of the three: a dropped entry is neither `want` nor
    `go_back_to`, so `stateFilter` would drop it anyway — which is exactly the
    kind of accident that stops holding the day someone widens a view. The
    assertion is on the guarantee, not on today's implementation of it.
  */
  it('excludes state = dropped from every public view', async () => {
    await pool.query(
      `insert into entries (user_id, item_id, intent, state, resolved_at)
       values ($1, $2, 'see', 'dropped', now())`,
      [ownerId, droppedItemId],
    )

    const viewer = asViewer(viewerId, `${VIEWER}@example.com`)

    for (const view of ['live', 'go_back_tos', 'fixtures'] as const) {
      const rows = await dal.listEntriesForOtherUser(viewer, ownerId, view)
      expect(rows.some((r) => r.entry.state === 'dropped')).toBe(false)
    }

    // The owner does see it — struck through in their own live list, which is the
    // case that makes the positive filter earn its keep: `stateFilter('live')`
    // selects `dropped`, and this still returns nothing to a stranger.
    const own = await dal.listMyEntries(asViewer(ownerId, `${OWNER}@example.com`), 'live')
    expect(own.some((r) => r.entry.state === 'dropped')).toBe(true)
  })

  /*
    The second door onto the same rows. A dropped entry that cannot be listed but
    can still be copied by id is the same leak wearing a different verb — and
    `copyEntry` carried its own hand-written `ne(state, 'done')`, so it had to be
    changed in the same breath.
  */
  it('refuses to copy a dropped capture', async () => {
    const { rows } = await pool.query(
      `insert into captures (user_id, text, possibility_id, intent, state, visibility)
       values ($1, 'a lapsed want', $2, 'see', 'dropped', 'mutuals') returning id`,
      [ownerId, droppedItemId],
    )
    for (const pair of [
      [ownerId, viewerId],
      [viewerId, ownerId],
    ]) {
      await pool.query(
        'insert into tracks (follower_id, followed_id) values ($1, $2) on conflict do nothing',
        pair,
      )
    }

    const result = await dal.copyCapture(asViewer(viewerId, `${VIEWER}@example.com`), rows[0].id)
    expect(result.ok).toBe(false)

    await pool.query('delete from captures where id = $1', [rows[0].id])
    await pool.query(
      'delete from tracks where follower_id = any($1::uuid[]) and followed_id = any($1::uuid[])',
      [[ownerId, viewerId]],
    )
  })
})

describe('the private note never leaves its owner', () => {
  it('is absent from another user’s projection even when set', async () => {
    const { rows } = await pool.query(
      `insert into entries (user_id, item_id, intent, state, note)
       values ($1, $2, 'own', 'want', 'the private part') returning id`,
      [ownerId, itemId],
    )

    const viewer = asViewer(viewerId, `${VIEWER}@example.com`)
    const [seen] = (await dal.listEntriesForOtherUser(viewer, ownerId, 'live')).filter(
      (r) => r.entry.id === rows[0].id,
    )

    expect(seen).toBeDefined()
    // Not `toBeNull` — the key must not be on the object at all, because the
    // failure being guarded against is `select({ entry: entries })` returning the
    // whole row.
    expect('note' in seen.entry).toBe(false)
    expect(JSON.stringify(seen)).not.toContain('the private part')
  })

  /*
    The owner side moved to captures with the mutations. The projection test
    above still reads `entries`, because that read still exists and its
    fixture is written with the raw driver — nothing in the product writes an
    entry any more.
  */
  const ownedCapture = async () => {
    const { rows } = await pool.query(
      `insert into captures (user_id, text, state, note)
       values ($1, 'noted', 'want', 'the private part')
       on conflict do nothing returning id`,
      [ownerId],
    )
    if (rows[0]) return rows[0].id as string
    const existing = await pool.query(
      `select id from captures where user_id = $1 and text = 'noted'`,
      [ownerId],
    )
    return existing.rows[0].id as string
  }

  it('is readable and writable by its owner', async () => {
    const owner = asViewer(ownerId, `${OWNER}@example.com`)
    const id = await ownedCapture()

    const [mine] = (await dal.listMyCaptures(owner, 'live')).filter(
      (r) => r.capture.id === id,
    )
    expect(mine.capture.note).toBe('the private part')

    const written = await dal.setCaptureNote(owner, id, '  trimmed  ')
    expect(written.ok).toBe(true)

    const cleared = await dal.setCaptureNote(owner, id, '')
    expect(cleared.ok && cleared.value.note).toBe(null)
  })

  it('cannot be written on someone else’s capture', async () => {
    const id = await ownedCapture()

    const result = await dal.setCaptureNote(
      asViewer(viewerId, `${VIEWER}@example.com`),
      id,
      'not yours',
    )
    expect(result.ok).toBe(false)
  })

  it('refuses a note longer than the bound', async () => {
    const owner = asViewer(ownerId, `${OWNER}@example.com`)
    const id = await ownedCapture()

    const result = await dal.setCaptureNote(owner, id, 'x'.repeat(dal.NOTE_MAX + 1))
    expect(result.ok).toBe(false)
  })
})

/*
  The capture gate. Four terms, and the test removes them one at a time —
  a guarantee that only ever gets tested in its passing configuration is a
  guarantee nobody has checked.
*/
describe('another user’s captures need all four positive terms', () => {
  const viewer = () => asViewer(viewerId, `${VIEWER}@example.com`)

  const clear = async () => {
    await pool.query('delete from captures where user_id = any($1::uuid[])', [
      [ownerId, viewerId],
    ])
    await pool.query(
      'delete from tracks where follower_id = any($1::uuid[]) and followed_id = any($1::uuid[])',
      [[ownerId, viewerId]],
    )
  }

  const track = async (from: string, to: string) =>
    pool.query(
      'insert into tracks (follower_id, followed_id) values ($1, $2) on conflict do nothing',
      [from, to],
    )

  const mutual = async () => {
    await track(ownerId, viewerId)
    await track(viewerId, ownerId)
  }

  const captureFor = async (
    fields: { state?: string; visibility?: string; note?: string | null } = {},
  ) => {
    const { rows } = await pool.query(
      `insert into captures (user_id, text, state, visibility, note)
       values ($1, 'try pottery', $2, $3, $4) returning id`,
      [ownerId, fields.state ?? 'want', fields.visibility ?? 'mutuals', fields.note ?? null],
    )
    return rows[0].id as string
  }

  beforeEach(clear)
  afterAll(clear)

  it('returns the capture when all four hold', async () => {
    await mutual()
    await captureFor()

    const rows = await dal.listCapturesForOtherUser(viewer(), ownerId, 'live')
    expect(rows).toHaveLength(1)
    expect(rows[0].capture.text).toBe('try pottery')
  })

  it('returns nothing when the scope is private', async () => {
    await mutual()
    await captureFor({ visibility: 'private' })

    expect(await dal.listCapturesForOtherUser(viewer(), ownerId, 'live')).toHaveLength(0)
  })

  it('returns nothing when the state is not published, however it is shared', async () => {
    await mutual()
    for (const state of ['done', 'dropped']) {
      await pool.query('delete from captures where user_id = $1', [ownerId])
      await captureFor({ state, visibility: 'mutuals' })

      for (const view of ['live', 'go_back_tos', 'fixtures'] as const) {
        expect(await dal.listCapturesForOtherUser(viewer(), ownerId, view)).toHaveLength(0)
      }
    }
  })

  it('returns nothing when the track runs only one way', async () => {
    await track(viewerId, ownerId)
    await captureFor()

    expect(await dal.listCapturesForOtherUser(viewer(), ownerId, 'live')).toHaveLength(0)

    await pool.query('delete from tracks where follower_id = $1 and followed_id = $2', [
      viewerId,
      ownerId,
    ])
    await track(ownerId, viewerId)

    expect(await dal.listCapturesForOtherUser(viewer(), ownerId, 'live')).toHaveLength(0)
  })

  it('returns nothing when there is no track at all', async () => {
    await captureFor()

    expect(await dal.listCapturesForOtherUser(viewer(), ownerId, 'live')).toHaveLength(0)
  })

  it('never carries the private note into the projection', async () => {
    await mutual()
    await captureFor({ note: 'why I put this here' })

    const rows = await dal.listCapturesForOtherUser(viewer(), ownerId, 'live')
    expect(rows).toHaveLength(1)
    expect(JSON.stringify(rows[0])).not.toContain('why I put this here')
    expect('note' in rows[0].capture).toBe(false)
  })

  it('refuses to copy a capture that is not shared', async () => {
    await mutual()
    const id = await captureFor({ visibility: 'private' })

    const result = await dal.copyCapture(viewer(), id)
    expect(result.ok).toBe(false)
  })

  it('refuses to copy a shared capture from a non-mutual', async () => {
    await track(viewerId, ownerId)
    const id = await captureFor()

    const result = await dal.copyCapture(viewer(), id)
    expect(result.ok).toBe(false)
  })

  it('returns nothing when the viewer is the owner, self-tracks and all', async () => {
    /*
      Seeded deliberately: a `tracks` row may name the same person twice, so
      both mutual joins succeed here and every other term holds. The only
      thing that can refuse this read is the term that says the reader is not
      the owner — which is why it is in the predicate and not in an early
      return above it.
    */
    await pool.query(
      'insert into tracks (follower_id, followed_id) values ($1, $1) on conflict do nothing',
      [ownerId],
    )
    await captureFor()

    const owner = asViewer(ownerId, `${OWNER}@example.com`)
    expect(await dal.listCapturesForOtherUser(owner, ownerId, 'live')).toHaveLength(0)

    await pool.query('delete from tracks where follower_id = $1 and followed_id = $1', [ownerId])
  })

  it('does not rewrite provenance when a dropped copy is added again', async () => {
    const { rows } = await pool.query(
      `insert into captures (user_id, text, possibility_id, intent, state, source, source_user_id)
       values ($1, 'a lapsed copy', $2, 'see', 'dropped', 'copy', $3) returning id`,
      [viewerId, itemId, ownerId],
    )

    const result = await dal.addCapture(asViewer(viewerId, `${VIEWER}@example.com`), {
      text: 'a lapsed copy',
      possibilityId: itemId,
      intent: 'see',
    })
    expect(result.ok).toBe(true)

    const after = await pool.query(
      'select state, source, source_user_id from captures where id = $1',
      [rows[0].id],
    )
    expect(after.rows[0]).toMatchObject({
      state: 'want',
      source: 'copy',
      source_user_id: ownerId,
    })
  })

  it('lets a dropped capture of your own acquire provenance when copied', async () => {
    await mutual()

    await pool.query(
      `insert into captures (user_id, text, possibility_id, intent, state, source)
       values ($1, 'mine first', $2, 'see', 'dropped', 'self')`,
      [viewerId, itemId],
    )

    const { rows } = await pool.query(
      `insert into captures (user_id, text, possibility_id, intent, state, visibility)
       values ($1, 'mine first', $2, 'see', 'want', 'mutuals') returning id`,
      [ownerId, itemId],
    )

    const result = await dal.copyCapture(asViewer(viewerId, `${VIEWER}@example.com`), rows[0].id)
    expect(result.ok).toBe(true)

    const after = await pool.query(
      'select state, source, source_user_id from captures where user_id = $1',
      [viewerId],
    )
    expect(after.rows).toHaveLength(1)
    /*
      Suppression may only ever increase: a row that was independently yours
      can become a copy, so the person it was taken from is not notified that
      you match them. It can never go the other way.
    */
    expect(after.rows[0]).toMatchObject({
      state: 'want',
      source: 'copy',
      source_user_id: ownerId,
    })
  })

  it('carries provenance when the copy is allowed, and lands it private', async () => {
    await mutual()
    const id = await captureFor()

    const result = await dal.copyCapture(viewer(), id)
    expect(result.ok).toBe(true)

    const { rows } = await pool.query(
      'select source, source_user_id, source_capture_id, visibility from captures where user_id = $1',
      [viewerId],
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      source: 'copy',
      source_user_id: ownerId,
      source_capture_id: id,
      visibility: 'private',
    })
  })
})

/*
  The fan-out reads the same scope the projection does. A convergence that
  fired on a private capture would tell somebody about a list its owner never
  opened — a notification is the one leak that arrives on its own.
*/
describe('convergence needs both sides to have shared', () => {
  const notificationsFor = async (userId: string) => {
    const { rows } = await pool.query(
      "select kind, payload from notifications where user_id = $1 and kind = 'convergence'",
      [userId],
    )
    return rows
  }

  const setUp = async (counterpartVisibility: string) => {
    await pool.query('delete from captures where user_id = any($1::uuid[])', [
      [ownerId, viewerId],
    ])
    await pool.query('delete from notifications where user_id = any($1::uuid[])', [
      [ownerId, viewerId],
    ])
    for (const pair of [
      [ownerId, viewerId],
      [viewerId, ownerId],
    ]) {
      await pool.query(
        'insert into tracks (follower_id, followed_id) values ($1, $2) on conflict do nothing',
        pair,
      )
    }

    await pool.query(
      `insert into captures (user_id, text, possibility_id, intent, state, visibility)
       values ($1, 'A Fixture', $2, 'see', 'want', $3)`,
      [ownerId, itemId, counterpartVisibility],
    )

    const { rows } = await pool.query(
      `insert into captures (user_id, text, possibility_id, intent, state, visibility)
       values ($1, 'A Fixture', $2, 'see', 'want', 'private') returning id`,
      [viewerId, itemId],
    )
    return rows[0].id as string
  }

  afterAll(async () => {
    await pool.query('delete from notifications where user_id = any($1::uuid[])', [
      [ownerId, viewerId],
    ])
    await pool.query(
      'delete from tracks where follower_id = any($1::uuid[]) and followed_id = any($1::uuid[])',
      [[ownerId, viewerId]],
    )
  })

  it('writes a convergence when the second side shares', async () => {
    const mine = await setUp('mutuals')

    const shared = await dal.setCaptureVisibility(
      asViewer(viewerId, `${VIEWER}@example.com`),
      mine,
      'mutuals',
    )
    expect(shared.ok).toBe(true)

    expect(await notificationsFor(ownerId)).toHaveLength(1)
    expect(await notificationsFor(viewerId)).toHaveLength(1)
  })

  /*
    The suppression rule, at the value that was missing from it. A transferred
    capture is not an independent intention — the person it names handed it
    over — and notifying them that you match is telling them something they are
    the source of.
  */
  it('writes nothing when the capture was transferred from the counterpart', async () => {
    const mine = await setUp('mutuals')

    await pool.query(
      "update captures set source = 'transfer', source_user_id = $2 where id = $1",
      [mine, ownerId],
    )

    const shared = await dal.setCaptureVisibility(
      asViewer(viewerId, `${VIEWER}@example.com`),
      mine,
      'mutuals',
    )
    expect(shared.ok).toBe(true)

    expect(await notificationsFor(ownerId)).toHaveLength(0)
    expect(await notificationsFor(viewerId)).toHaveLength(0)
  })

  it('writes nothing when the capture was copied from the counterpart', async () => {
    const mine = await setUp('mutuals')

    await pool.query(
      "update captures set source = 'copy', source_user_id = $2 where id = $1",
      [mine, ownerId],
    )

    const shared = await dal.setCaptureVisibility(
      asViewer(viewerId, `${VIEWER}@example.com`),
      mine,
      'mutuals',
    )
    expect(shared.ok).toBe(true)

    expect(await notificationsFor(ownerId)).toHaveLength(0)
    expect(await notificationsFor(viewerId)).toHaveLength(0)
  })

  it('writes nothing when the counterpart has not shared', async () => {
    const mine = await setUp('private')

    const shared = await dal.setCaptureVisibility(
      asViewer(viewerId, `${VIEWER}@example.com`),
      mine,
      'mutuals',
    )
    expect(shared.ok).toBe(true)

    expect(await notificationsFor(ownerId)).toHaveLength(0)
    expect(await notificationsFor(viewerId)).toHaveLength(0)
  })
})

describe('a swap stays blind until both sides commit (§7.3)', () => {
  it('withholds the counterparty’s picks while one side is uncommitted', async () => {
    const { rows: swap } = await pool.query(
      `insert into swaps (initiator_id, recipient_id, status, initiator_committed_at)
       values ($1, $2, 'pending', now()) returning id`,
      [ownerId, viewerId],
    )
    await pool.query(
      `insert into swap_items (swap_id, from_user_id, item_id) values ($1, $2, $3)
       on conflict do nothing`,
      [swap[0].id, ownerId, itemId],
    )

    const half = await dal.getSwap(asViewer(viewerId, `${VIEWER}@example.com`), swap[0].id)
    expect(half.ok).toBe(true)
    if (half.ok) {
      expect(JSON.stringify(half.value)).not.toContain(itemId)
    }

    // Both committed: the picks become visible, so the withholding is the blind
    // rule and not the query simply never returning items.
    await pool.query('update swaps set recipient_committed_at = now() where id = $1', [swap[0].id])

    const both = await dal.getSwap(asViewer(viewerId, `${VIEWER}@example.com`), swap[0].id)
    expect(both.ok).toBe(true)
    if (both.ok) {
      expect(JSON.stringify(both.value)).toContain(itemId)
    }
  })
})

