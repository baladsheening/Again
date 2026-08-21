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
  it('refuses to copy a dropped entry', async () => {
    const { rows } = await pool.query(
      `select id from entries where user_id = $1 and item_id = $2 and intent = 'see'`,
      [ownerId, droppedItemId],
    )

    const result = await dal.copyEntry(asViewer(viewerId, `${VIEWER}@example.com`), rows[0].id)
    expect(result.ok).toBe(false)
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

  it('is readable and writable by its owner', async () => {
    const owner = asViewer(ownerId, `${OWNER}@example.com`)
    const [mine] = (await dal.listMyEntries(owner, 'live')).filter(
      (r) => r.entry.intent === 'own',
    )

    expect(mine.entry.note).toBe('the private part')

    const written = await dal.setEntryNote(owner, mine.entry.id, '  trimmed  ')
    expect(written.ok).toBe(true)

    const cleared = await dal.setEntryNote(owner, mine.entry.id, '')
    expect(cleared.ok && cleared.value.note).toBe(null)
  })

  it('cannot be written on someone else’s entry', async () => {
    const owner = asViewer(ownerId, `${OWNER}@example.com`)
    const [mine] = (await dal.listMyEntries(owner, 'live')).filter(
      (r) => r.entry.intent === 'own',
    )

    const result = await dal.setEntryNote(
      asViewer(viewerId, `${VIEWER}@example.com`),
      mine.entry.id,
      'not yours',
    )
    expect(result.ok).toBe(false)
  })

  it('refuses a note longer than the bound', async () => {
    const owner = asViewer(ownerId, `${OWNER}@example.com`)
    const [mine] = (await dal.listMyEntries(owner, 'live')).filter(
      (r) => r.entry.intent === 'own',
    )

    const result = await dal.setEntryNote(owner, mine.entry.id, 'x'.repeat(dal.NOTE_MAX + 1))
    expect(result.ok).toBe(false)
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

