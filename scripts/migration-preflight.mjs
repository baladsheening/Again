/**
 * Phase 0 migration — preflight (§1.2 and §1.3 of the runbook).
 *
 * Reads. Writes nothing. Safe to run against any branch, including production,
 * which is the point: the operator has to be able to look before they touch.
 *
 * ⚠ **It prints the host it connected to before it prints anything else.** The
 * whole procedure depends on the right database being on the other end of the
 * connection, and a runbook step that says *check the host* is a step that gets
 * skipped. This one cannot be.
 *
 *   npm run migration:preflight
 *
 * with `DATABASE_URL` set to the branch being inspected. See the runbook for
 * how to set it in PowerShell without leaving it set.
 */
import { config } from 'dotenv'
import { Pool, neonConfig } from '@neondatabase/serverless'

config({ path: '.env.local', quiet: true })
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

let failures = 0

/** A check that must come back zero, with the reason it exists. */
const mustBeZero = async (label, sql, because) => {
  const { rows } = await pool.query(sql)
  const n = Number(rows[0].n)
  const ok = n === 0
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${n}`)
  if (!ok) console.log(`      ${because}`)
}

const report = async (label, sql) => {
  const { rows } = await pool.query(sql)
  console.log(`      ${label}: ${JSON.stringify(rows)}`)
}

try {
  console.log('counts — write these down; the post-migration checks compare against them')
  await report('entries ', 'select count(*)::int as n from entries')
  await report('items   ', 'select count(*)::int as n from items')
  await report('profiles', 'select count(*)::int as n from profiles')
  console.log('')

  console.log('preconditions')
  await mustBeZero(
    'items with half an external pair ',
    `select count(*)::int as n from items
      where (external_source is null) <> (external_id is null)`,
    '0004 adds a check requiring both external columns or neither, and validates existing rows.',
  )
  await mustBeZero(
    'entries orphaned from items      ',
    `select count(*)::int as n from entries e
      where not exists (select 1 from items i where i.id = e.item_id)`,
    '0005 inner-joins entries to items, so an orphan is skipped in silence rather than failing.',
  )
  await mustBeZero(
    'entries sourced from their owner ',
    `select count(*)::int as n from entries where source_user_id = user_id`,
    'captures_source_is_not_owner refuses these, and the backfill would abort.',
  )
  console.log('')

  console.log('context')
  await report('entry sources    ', 'select source, count(*)::int as n from entries group by 1 order by 1')
  await report(
    'migrations applied',
    `select count(*)::int as n from drizzle.__drizzle_migrations`,
  )
  await report(
    'captures table   ',
    `select (to_regclass('public.captures') is not null) as exists`,
  )
} finally {
  await pool.end()
}

console.log('')
console.log(failures === 0 ? 'PREFLIGHT OK' : `PREFLIGHT FAILED — ${failures} check(s)`)
process.exit(failures === 0 ? 0 : 1)
