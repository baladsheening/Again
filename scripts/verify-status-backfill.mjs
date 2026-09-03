/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Step A's proof: `status`/`verdict` say exactly what `state` says — 3 Sep
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The vocabulary migration's stage 1, step A, adds two columns and backfills
 * them from `state`. This asserts the mapping held for **every row**, by
 * grouping on the triple and checking each group against the table rather than
 * by spot-checking a few rows.
 *
 * ⚠ **It reads and writes nothing.** Safe against any branch and against
 * production — which is the point: `scripts/prod-check.sh` wraps
 * `migration:state` for the same reason, and this is the companion that says
 * whether the data landed rather than whether the DDL did.
 *
 * ⚠ **The two-way check is what makes it a proof rather than a smoke test.**
 * Every `state` must map to its pair, AND every pair must come from its state —
 * a one-way check passes on a backfill that also wrote rows it should not have.
 *
 * Run: `node scripts/verify-status-backfill.mjs`
 * Production: the same shell shape as `scripts/prod-check.sh`.
 */
import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local', quiet: true }) // never overrides an already-set var

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const sql = neon(url)

/* The mapping, written once, in the same order as the migration states it. */
const MAPPING = [
  ['want', 'active', null],
  ['done', 'completed', null],
  ['go_back_to', 'completed', 'again'],
  ['fixture', 'completed', 'have'],
  ['dropped', 'dropped', null],
]

const host = new URL(url.replace(/^postgres(ql)?:/, 'https:')).host
console.log(`host      ${host}\n`)

const rows = await sql`
  SELECT state, status, verdict, count(*)::int AS n
  FROM captures
  GROUP BY state, status, verdict
  ORDER BY state, status, verdict
`

const total = rows.reduce((a, r) => a + r.n, 0)
console.log(`${total} captures, in ${rows.length} distinct (state, status, verdict) groups\n`)

const fails = []
const check = (name, ok, got) => {
  if (!ok) fails.push(name)
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok ? '' : `  ${JSON.stringify(got)}`}`)
}

for (const row of rows) {
  const want = MAPPING.find((m) => m[0] === row.state)
  const label = `${row.state} -> ${row.status} / ${row.verdict ?? 'null'}  (${row.n})`
  if (!want) {
    check(`${label}: is a state the mapping knows`, false, row)
    continue
  }
  check(label, row.status === want[1] && (row.verdict ?? null) === want[2], {
    expected: { status: want[1], verdict: want[2] },
  })
}

/* ⚠ The other direction: nothing may be left unconverted, and no pair may exist
   that the mapping cannot produce. */
const [{ n: unconverted }] = await sql`
  SELECT count(*)::int AS n FROM captures WHERE status IS NULL
`
check('no capture was left unconverted', unconverted === 0, { unconverted })

const [{ n: badShape }] = await sql`
  SELECT count(*)::int AS n FROM captures
  WHERE verdict IS NOT NULL AND status <> 'completed'
`
check('no verdict sits on a capture that is not completed', badShape === 0, { badShape })

const [{ n: strange }] = await sql`
  SELECT count(*)::int AS n FROM captures
  WHERE status NOT IN ('active', 'completed', 'dropped')
     OR (verdict IS NOT NULL AND verdict NOT IN ('again', 'have'))
`
check('every value is one the domain declares', strange === 0, { strange })

/* ⚠ The privacy predicate, re-derived rather than renamed — the one edit in
   this migration that can leak. `PUBLIC_STATES` is want/go_back_to/fixture, and
   the new form has to select the same rows and no others. */
const [{ n: mismatch }] = await sql`
  SELECT count(*)::int AS n FROM captures
  WHERE (state IN ('want', 'go_back_to', 'fixture'))
     <> (status = 'active' OR verdict IN ('again', 'have'))
`
check('the re-derived PUBLIC_STATES selects exactly the old rows', mismatch === 0, { mismatch })

console.log(fails.length ? `\n${fails.length} FAILED` : '\nall ok — the backfill is exact')

/*
  ⚠ **`process.exitCode`, never `process.exit()` — measured, not stylistic.**
  With `process.exit()` this script died on `Assertion failed:
  !(handle->flags & UV_HANDLE_CLOSING), file src\\win\\async.c` and returned
  **127** on a run where every check passed. The Neon driver still has a handle
  open when the process is torn down mid-flight, and libuv aborts. A verifier
  that reports failure on success is worse than no verifier — it is the thing
  somebody runs before a production migration.

  Setting the code and letting node drain exits cleanly with the real result.
*/
process.exitCode = fails.length ? 1 : 0
