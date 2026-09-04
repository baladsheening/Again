/**
 * ⚠ **A local seeding script for the portal, and it writes to whatever
 * `DATABASE_URL` points at.** It exists because a convergence needs two accounts
 * with mutual tracks and captures resolved to one possibility, and that is a
 * long way to drive a browser for a surface that only has to be looked at.
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

/*
  ⚠ **The same production guard the tests carry, and for the same reason.** This
  writes rows. `.env.local` is a file somebody can repoint in a second, and a
  seeding script that quietly worked against production would be the 25 August
  failure with a different cause.
*/
const PRODUCTION_DB_HOST = 'ep-royal-math-zalwuq2s-pooler.c-2.eu-west-2.aws.neon.tech'
if (new URL(process.env.DATABASE_URL).hostname === PRODUCTION_DB_HOST) {
  throw new Error('DATABASE_URL points at production — refusing to seed.')
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const q = async (text, params) => (await pool.query(text, params)).rows

const account = JSON.parse(readFileSync('node_modules/.probe/account.json', 'utf8'))
const [me] = await q('select id, handle, display_name from profiles where handle = $1', [
  account.handle,
])
if (!me) throw new Error(`no profile for ${account.handle}`)

/* A possibility to converge on, and one of my captures pointed at it. */
const [poss] = await q(
  `insert into items (kind, external_source, external_id, title, year)
   values ('film', 'tmdb', $1, $2, 1994)
   on conflict do nothing
   returning id, title`,
  [`portal-seed-${Date.now()}`, 'The Shawshank Redemption'],
)

const [mine] = await q(
  /*
    ⚠ **`status` is written, and this script was broken without it — 4
    September.** Step C1 of the vocabulary migration made `captures.status` NOT
    NULL, and a raw insert that names its columns does not get a backfill's
    help. The two axes are the record now; `state` is written beside it only
    because the column is still there and step C3 has not dropped it.
  */
  `insert into captures (user_id, text, state, status, intent, visibility, source, possibility_id)
   values ($1, $2, 'want', 'active', 'see', 'mutuals', 'self', $3)
   returning id, text`,
  [me.id, `portal seed ${new Date().toISOString().slice(11, 19)}`, poss.id],
)

const rows = [
  ['convergence', 'Sam', false],
  ['convergence', 'Ali', false],
  ['guide', 'Jo', true],
]
for (const [kind, name, guideHolder] of rows) {
  await q(
    `insert into notifications (user_id, kind, payload)
     values ($1, $2, $3::jsonb)`,
    [
      me.id,
      kind,
      JSON.stringify({
        itemId: poss.id,
        title: poss.title,
        counterpartId: me.id,
        counterpartName: name,
        ...(guideHolder ? { guideHolder: true } : {}),
      }),
    ],
  )
}

console.log('seeded for', me.handle, '\n  possibility', poss.id, '\n  capture', mine.id, mine.text)
console.log('  notifications', rows.map((r) => `${r[0]}/${r[1]}`).join(', '))
await pool.end()
