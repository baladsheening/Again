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

try {
  const applied = await pool.query(
    'select count(*)::int as n from drizzle.__drizzle_migrations',
  )
  console.log(`applied migrations  ${applied.rows[0].n}  (the tree has 11: 0000-0010)`)
  console.log('')

  const { rows } = await pool.query(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'captures'
      and column_name in ('suggested_possibility_id', 'resolution_declined_at', 'image_path')
  `)
  const found = rows.map((r) => r.column_name)
  let missing = 0
  for (const c of ['suggested_possibility_id', 'resolution_declined_at', 'image_path']) {
    const ok = found.includes(c)
    if (!ok) missing += 1
    console.log(`${ok ? 'ok  ' : 'MISS'}  captures.${c}`)
  }
  console.log('')
  console.log(missing === 0 ? 'ALL PRESENT — the page can read this database.' : `${missing} MISSING — GET / is a 500 against this database.`)
} finally {
  await pool.end()
}
