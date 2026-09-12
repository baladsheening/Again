/**
 * **A console carrying everything at once** — 12 September.
 *
 * Asked: *how do we reorganise the console's contents so it's easily
 * understandable and not too jampacked?* **That cannot be judged on a console
 * with two facts in it**, and the dense case is hard to reach by hand: it needs
 * a line that has converged, has kin, has moved twice, has resolved to a
 * possibility, and is locked. This writes one.
 *
 * ⚠ **Development only**, and it refuses production by host. Run:
 *   node scripts/seed-console-full.mjs
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

const unit = (axis, tilt = 0) => {
  const v = new Array(1024).fill(0)
  v[axis] = 1
  v[(axis + 1) % 1024] = tilt
  const norm = Math.hypot(1, tilt)
  return `[${v.map((n) => n / norm).join(',')}]`
}

/* A possibility, so the stamp row carries a year as well. */
const { rows: items } = await pool.query(
  `insert into items (kind, external_source, external_id, title, year, qualifier, image_path)
   values ('film', 'tmdb', 'console-full', 'A Crowded Console', 1983, '1983', '/x.jpg')
   on conflict (kind, external_id) do update set title = excluded.title
   returning id`,
)
const itemId = items[0].id

const stamp = Date.now().toString(36)
const main = `${stamp} learn to sail a boat`
const kin = `${stamp} sailing lessons on the coast`

const write = async (text, vector, possibility) => {
  const { rows } = await pool.query(
    `insert into captures (user_id, text, state, status, intent, visibility, source,
                           possibility_id, embedding, created_at, captured_at)
     values ($1, $2, 'want', 'active', 'see', 'private', 'self', $3, $4::vector,
             now() - interval '60 days', now())
     returning id, normalised_text`,
    [userId, text, possibility, vector],
  )
  return rows[0]
}

const a = await write(main, unit(21), itemId)
const b = await write(kin, unit(21, 0.15), null)

await pool.query(
  `insert into capture_akin (capture_id, akin_id, distance)
   values ($1, $2, 0.02), ($2, $1, 0.02) on conflict do nothing`,
  [a.id, b.id],
)

await pool.query(
  `insert into capture_prior_dates (capture_id, at)
   values ($1, now() - interval '9 days'), ($1, now() - interval '60 days')
   on conflict do nothing`,
  [a.id],
)

/* A convergence, so the sentence and `Ask them` are on it too. */
await pool.query(
  `insert into notifications (user_id, kind, payload)
   values ($1, 'convergence', $2::jsonb)`,
  [
    userId,
    JSON.stringify({
      itemId,
      title: main,
      counterpartId: userId,
      counterpartName: 'Sam',
    }),
  ],
)

console.log(`seeded for ${account.handle}:\n  ${main}\n  ${kin}`)
console.log('locked, resolved, converged, kin, and moved twice.')
await pool.end()
