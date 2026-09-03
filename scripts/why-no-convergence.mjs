/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why has nothing converged? — 4 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A convergence needs FOUR things true at once (§6, and `lib/overlap.ts`):
 *
 *   1. a MUTUAL track — both rows of `tracks`, not one
 *   2. both captures RESOLVED to the same possibility — overlap joins on
 *      `possibility_id`, so identical words that resolved to nothing match
 *      nothing
 *   3. both in a SHARED scope — `mutuals`, not `private`
 *   4. both with an INTENT, and the pair in `classify`'s allowlist
 *
 * ⚠ **Any one of them missing produces silence, and the silence is identical
 * in all four cases.** That is exactly the failure mode the product is designed
 * around, so it is also the one that is hardest to debug from the app. This
 * prints which of the four is false.
 *
 * ⚠ **Reads. Writes nothing.** Safe against production, which is the point.
 */
import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local', quiet: true })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}
const sql = neon(url)

console.log(`host      ${new URL(url.replace(/^postgres(ql)?:/, 'https:')).host}\n`)

const people = await sql`
  SELECT p.id, p.handle, p.display_name,
         (SELECT count(*)::int FROM captures c WHERE c.user_id = p.id) AS captures
  FROM profiles p ORDER BY p.handle
`
console.log(`── accounts (${people.length})`)
for (const p of people) console.log(`   @${p.handle}  ${p.captures} captures`)

const tracks = await sql`
  SELECT f.handle AS follower, d.handle AS followed,
         EXISTS (SELECT 1 FROM tracks r
                 WHERE r.follower_id = t.followed_id AND r.followed_id = t.follower_id) AS mutual
  FROM tracks t
  JOIN profiles f ON f.id = t.follower_id
  JOIN profiles d ON d.id = t.followed_id
  ORDER BY f.handle, d.handle
`
console.log(`\n── tracks (${tracks.length})`)
if (!tracks.length) console.log('   NONE. ⚠ This alone stops every convergence.')
for (const t of tracks) {
  console.log(`   @${t.follower} → @${t.followed}   ${t.mutual ? 'MUTUAL ✓' : 'one-sided — the other side is missing'}`)
}

/* Captures that could converge with somebody: shared, resolved, with an intent. */
const eligible = await sql`
  SELECT p.handle, c.text, c.possibility_id, i.title, c.intent, c.status, c.verdict, c.visibility, c.source
  FROM captures c
  JOIN profiles p ON p.id = c.user_id
  LEFT JOIN items i ON i.id = c.possibility_id
  WHERE c.possibility_id IS NOT NULL
  ORDER BY i.title, p.handle
`
console.log(`\n── resolved captures (${eligible.length}) — only these can converge`)
if (!eligible.length) {
  console.log('   NONE. ⚠ Overlap joins on possibility_id: two people typing the')
  console.log('   same words converge on NOTHING unless both accepted a film.')
}
for (const c of eligible) {
  const flags = [
    c.visibility === 'private' ? 'LOCKED (private)' : 'shared',
    c.intent ?? 'NO INTENT',
    `${c.status}${c.verdict ? '/' + c.verdict : ''}`,
    c.source !== 'self' ? `source=${c.source} — SUPPRESSED` : null,
  ].filter(Boolean)
  console.log(`   @${c.handle}  "${c.text}"  →  ${c.title ?? '?'}  [${flags.join(', ')}]`)
}

/* Where two people hold the same possibility. */
const pairs = await sql`
  SELECT i.title,
         count(DISTINCT c.user_id)::int AS holders,
         string_agg(DISTINCT p.handle, ', ') AS who
  FROM captures c
  JOIN profiles p ON p.id = c.user_id
  JOIN items i ON i.id = c.possibility_id
  GROUP BY i.title HAVING count(DISTINCT c.user_id) > 1
`
console.log(`\n── possibilities held by more than one person (${pairs.length})`)
if (!pairs.length) console.log('   NONE — nothing to converge on yet.')
for (const r of pairs) console.log(`   ${r.title}  —  ${r.who}`)

const notes = await sql`SELECT count(*)::int AS n FROM notifications`
console.log(`\n── notifications written, ever: ${notes[0].n}`)

console.log(`
Reading this: every line above must be green before a convergence exists.
A mutual track is the gate; a resolved possibility is what overlap joins on;
a shared scope is what lets it out; and a copied capture is suppressed on
purpose. Adding the missing one fires the fan-out — a track becoming mutual
re-runs overlap over everything both people already hold.`)
