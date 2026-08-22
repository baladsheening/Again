/**
 * Phase 0 migration — post-migration verification (§4 of the runbook).
 *
 * Reads. Writes nothing. Run it after `db:migrate` and before deploying; every
 * check here passed on the `development` branch before the runbook was written.
 *
 * ⚠ **The SQL lives here and not in the runbook.** A procedure that asks an
 * operator to paste fifteen statements into a console is a procedure with
 * fifteen chances to paste one wrong, and the prose copy drifts from the real
 * one the first time either is edited. The runbook says what each check means;
 * this says it in SQL, once.
 *
 *   npm run migration:verify
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

const check = async (label, sql, expected, describe = (v) => String(v)) => {
  const { rows } = await pool.query(sql)
  const actual = rows[0]?.value ?? null
  const ok = String(actual) === String(expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? 'ok  ' : 'FAIL'}  ${label}: ${describe(actual)}${ok ? '' : `  (expected ${expected})`}`,
  )
}

try {
  console.log('4.1  the backfill is complete and faithful')
  await check(
    'every entry has a capture      ',
    `select (select count(*) from entries)
          = (select count(*) from captures where legacy_entry_id is not null) as value`,
    true,
  )
  await check(
    'entries with no capture        ',
    `select count(*)::int as value from entries e
      where not exists (select 1 from captures c where c.legacy_entry_id = e.id)`,
    0,
  )
  await check(
    'field mismatches, eight columns',
    `select count(*)::int as value
       from captures c
       join entries e on e.id = c.legacy_entry_id
       join items i on i.id = e.item_id
      where c.text is distinct from i.title
         or c.possibility_id is distinct from e.item_id
         or c.intent is distinct from e.intent
         or c.state is distinct from e.state
         or c.return_count is distinct from e.return_count
         or c.note is distinct from e.note
         or c.created_at is distinct from e.created_at
         or c.resolved_at is distinct from e.resolved_at`,
    0,
  )
  console.log('')

  console.log('4.2  privacy and provenance')
  await check(
    'captures that are not private  ',
    `select count(*)::int as value from captures where visibility <> 'private'`,
    0,
  )
  await check(
    'provenance shape violations    ',
    `select count(*)::int as value from captures
      where (source = 'self'
             and (source_user_id is not null or source_capture_id is not null))
         or (source <> 'self' and source_user_id is null)`,
    0,
  )
  console.log('')

  console.log('4.3  timestamps and normalisation')
  await check(
    'updated_at wrong on migrated   ',
    `select count(*)::int as value from captures
      where legacy_entry_id is not null
        and updated_at is distinct from coalesce(resolved_at, created_at)`,
    0,
  )
  await check(
    'normalised_text null or empty  ',
    `select count(*)::int as value from captures
      where normalised_text is null or normalised_text = ''`,
    0,
  )
  console.log('')

  console.log('4.4  the constraints exist and are what they claim')
  await check(
    'source_user_id delete action   ',
    `select confdeltype as value from pg_constraint
      where conname = 'captures_source_user_id_profiles_id_fk'`,
    'r',
    (v) => `${v} (r = restrict)`,
  )
  await check(
    'the three check constraints    ',
    `select count(*)::int as value from pg_constraint
      where conname in ('captures_provenance_shape',
                        'captures_source_is_not_owner',
                        'items_external_pair')`,
    3,
  )
  await check(
    'the retirement trigger         ',
    `select coalesce(max(tgenabled), '-') as value from pg_trigger
      where tgname = 'profiles_retire_capture_source'`,
    'O',
    (v) => `${v} (O = enabled)`,
  )
  await check(
    'migrations applied             ',
    `select count(*)::int as value from drizzle.__drizzle_migrations`,
    9,
    (v) => `${v} (0000-0008)`,
  )
  console.log('')

  const { rows } = await pool.query(
    `select source, count(*)::int as n,
            count(source_user_id)::int as with_user,
            count(source_capture_id)::int as with_capture
       from captures group by 1 order by 1`,
  )
  console.log(`      provenance spread: ${JSON.stringify(rows)}`)

  const sample = await pool.query(
    'select text, normalised_text from captures order by created_at limit 3',
  )
  console.log(`      normalisation sample: ${JSON.stringify(sample.rows)}`)
} finally {
  await pool.end()
}

console.log('')
console.log(
  failures === 0
    ? 'VERIFY OK — safe to deploy'
    : `VERIFY FAILED — ${failures} check(s). Do not deploy; the old code is still correct.`,
)
process.exit(failures === 0 ? 0 : 1)
