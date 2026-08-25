/**
 * Ad-hoc: what database is DATABASE_URL pointed at, how many migrations has it
 * applied, and do 0009/0010's columns exist on it.
 *
 * Reads. Writes nothing. Safe against any branch, which is the point — run it
 * before `npx drizzle-kit migrate` to confirm the host, and after to confirm
 * the columns landed.
 *
 * It prints the host before anything else, for the reason
 * scripts/migration-preflight.mjs does.
 */
import { readFileSync } from 'node:fs'

import { config } from 'dotenv'
import { Pool, neonConfig } from '@neondatabase/serverless'

config({ path: '.env.local', quiet: true }) // never overrides an already-set var
neonConfig.webSocketConstructor ??= globalThis.WebSocket

const url = process.env.DATABASE_URL ?? ''
if (!url) {
  console.error('DATABASE_URL is unset.')
  process.exit(1)
}

console.log(`host      ${new URL(url).hostname}`)
console.log(`database  ${new URL(url).pathname.slice(1)}`)
console.log('')

const pool = new Pool({ connectionString: url })

/*
  ⚠ **Read from the journal, never written down here.** This script printed
  "the tree has 11: 0000-0010" for as long as that was true and then kept
  printing it — inside the one tool whose whole purpose is to stop a register
  going stale about the database. A number a person has to remember to update is
  the bug this file exists to prevent, so it is derived from the same file
  `drizzle-kit` migrates from.
*/
const journal = JSON.parse(
  readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8'),
)
const expected = journal.entries.length
const newest = journal.entries[expected - 1].tag

/*
  ⚠ **The columns the page's read selects, and this list *is* maintained by
  hand.** There is no honest way to derive it: what makes a missing column an
  outage is that `listMyPage` names it, and that is a fact about a TypeScript
  query rather than about the migration tree. Add to it in the same commit as
  the column, which is the commit that already has to think about ordering.
*/
const REQUIRED = [
  'suggested_possibility_id',
  'resolution_declined_at',
  'image_path',
  'source_url',
]

try {
  const applied = await pool.query(
    'select count(*)::int as n from drizzle.__drizzle_migrations',
  )
  const n = applied.rows[0].n
  console.log(`applied migrations  ${n}  (the tree has ${expected}, newest ${newest})`)
  if (n < expected) console.log(`BEHIND by ${expected - n} — migrate before deploying.`)
  if (n > expected) console.log('AHEAD of this checkout — you are on an older branch.')
  console.log('')

  const { rows } = await pool.query(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'captures'
       and column_name = any($1::text[])`,
    [REQUIRED],
  )
  const found = rows.map((r) => r.column_name)
  let missing = 0
  for (const c of REQUIRED) {
    const ok = found.includes(c)
    if (!ok) missing += 1
    console.log(`${ok ? 'ok  ' : 'MISS'}  captures.${c}`)
  }
  console.log('')
  console.log(
    missing === 0
      ? 'ALL PRESENT — the page can read this database.'
      : `${missing} MISSING — GET / is a 500 against this database.`,
  )
} finally {
  await pool.end()
}
