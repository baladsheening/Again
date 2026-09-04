/**
 * ⚠ **A local seeding script for a PENDING REQUEST, and it writes to whatever
 * `DATABASE_URL` points at.** Sibling of `seed-portal.mjs`, and it exists for
 * the same reason: a request needs a second account that has added you, and
 * that is a long way to drive a browser for a surface that only has to be
 * looked at.
 *
 * It writes what `trackUser` writes — a track row pointing at the probe
 * account, and an unread `track_request` naming the asker by `@handle`. Both
 * terms of `pendingRequest` are therefore satisfied by construction, which is
 * the point: if the surface shows nothing after this, the surface is wrong.
 *
 * Run it against `development` only. It prints what it wrote.
 */
import { readFileSync } from 'node:fs'
import { Pool, neonConfig } from '@neondatabase/serverless'

if (!neonConfig.webSocketConstructor) neonConfig.webSocketConstructor = globalThis.WebSocket

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n\r]*)"?\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

/* The same production guard the tests and `seed-portal.mjs` carry. */
const PRODUCTION_DB_HOST = 'ep-royal-math-zalwuq2s-pooler.c-2.eu-west-2.aws.neon.tech'
if (new URL(process.env.DATABASE_URL).hostname === PRODUCTION_DB_HOST) {
  throw new Error('DATABASE_URL points at production — refusing to seed.')
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const q = async (text, params) => (await pool.query(text, params)).rows

const account = JSON.parse(readFileSync('node_modules/.probe/account.json', 'utf8'))
const [me] = await q('select id, handle from profiles where handle = $1', [account.handle])
if (!me) throw new Error(`no profile for ${account.handle}`)

/* The asker. A real account, because the read joins `profiles` for the handle. */
const handle = `asker${Date.now().toString().slice(-6)}`
const email = `${handle}@example.com`

const [user] = await q(
  `insert into "user" (name, email, "emailVerified") values ($1, $2, true)
   on conflict (email) do update set name = excluded.name returning id`,
  [handle, email],
)
await q(
  `insert into profiles (id, handle, handle_skeleton, display_name)
   values ($1, $2, $2, $3) on conflict (id) do nothing`,
  [user.id, handle, 'A Seeded Asker'],
)

await q(
  `insert into tracks (follower_id, followed_id) values ($1, $2) on conflict do nothing`,
  [user.id, me.id],
)

await q(
  `insert into notifications (user_id, kind, payload)
   values ($1, 'track_request', $2::jsonb)`,
  [me.id, JSON.stringify({ counterpartId: user.id, counterpartName: `@${handle}` })],
)

console.log(`seeded: @${handle} has added @${me.handle} and is waiting`)
await pool.end()
