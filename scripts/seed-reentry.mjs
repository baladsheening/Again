/**
 * **A line with a history on it** — 12 September.
 *
 * `node_modules/.probe/reenter.mjs` needs a console whose stamp row shows days
 * other than today, and a probe cannot age a row: everything it does happens in
 * one afternoon, which is exactly the case that reads *Today · Today*. This
 * writes one capture whose `captured_at` is today and whose prior dates are a
 * week and a month back.
 *
 * ⚠ **Development only**, and it refuses production by host. Run:
 *   node scripts/seed-reentry.mjs
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

const text = `${Date.now().toString(36)} a line with a history`

const { rows } = await pool.query(
  `insert into captures (user_id, text, state, status, intent, visibility, source,
                         created_at, captured_at)
   values ($1, $2, 'want', 'active', 'see', 'mutuals', 'self',
           now() - interval '40 days', now())
   returning id`,
  [userId, text],
)
const id = rows[0].id

await pool.query(
  `insert into capture_prior_dates (capture_id, at)
   values ($1, now() - interval '7 days'), ($1, now() - interval '40 days')
   on conflict do nothing`,
  [id],
)

console.log(`seeded for ${account.handle}:\n  ${text}`)
await pool.end()
