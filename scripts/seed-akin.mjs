/**
 * **Two akin lines on the probe account** — 12 September.
 *
 * `node_modules/.probe/akin.mjs` needs a record with an asterisk on it, and the
 * real path to one is a paid embedding call. This writes the vectors and the
 * pair by hand, exactly as `tests/akin.test.ts` does and for the same reason:
 * **what Voyage produces is numbers; what this repository owns is everything
 * after them.**
 *
 * ⚠ **Development only**, and it refuses production by host. Run:
 *   node scripts/seed-akin.mjs
 */
import { readFileSync } from 'node:fs'
import { Pool, neonConfig } from '@neondatabase/serverless'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const PRODUCTION_DB_HOST = 'ep-royal-math-zalwuq2s-pooler.c-2.eu-west-2.aws.neon.tech'
const url = process.env.DATABASE_URL ?? ''
if (new URL(url).hostname === PRODUCTION_DB_HOST) {
  throw new Error('This writes. DATABASE_URL points at production — refusing to run.')
}

neonConfig.webSocketConstructor ??= globalThis.WebSocket
const pool = new Pool({ connectionString: url })

const account = JSON.parse(
  readFileSync(new URL('../node_modules/.probe/account.json', import.meta.url), 'utf8'),
)

const { rows: people } = await pool.query('select id from "user" where email = $1', [
  account.email,
])
if (people.length === 0) throw new Error(`No such account: ${account.email}. Run the auth probe.`)
const userId = people[0].id

/** A unit vector down one axis, leaning slightly toward the next. */
const unit = (axis, tilt = 0) => {
  const v = new Array(1024).fill(0)
  v[axis] = 1
  v[(axis + 1) % 1024] = tilt
  const norm = Math.hypot(1, tilt)
  return `[${v.map((n) => n / norm).join(',')}]`
}

const stamp = Date.now().toString(36)
const sail = `${stamp} learn to sail`
const lessons = `${stamp} sailing lessons`

const write = async (text, vector) => {
  const { rows } = await pool.query(
    `insert into captures (user_id, text, state, status, intent, visibility, source, embedding)
     values ($1, $2, 'want', 'active', 'see', 'mutuals', 'self', $3::vector) returning id`,
    [userId, text, vector],
  )
  return rows[0].id
}

const a = await write(sail, unit(11))
const b = await write(lessons, unit(11, 0.15))

await pool.query(
  `insert into capture_akin (capture_id, akin_id, distance)
   values ($1, $2, 0.011), ($2, $1, 0.011) on conflict do nothing`,
  [a, b],
)

console.log(`seeded for ${account.handle}:\n  ${sail}\n  ${lessons}`)
await pool.end()
