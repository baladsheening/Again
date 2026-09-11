/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why has nothing converged? — 4 September, rewritten 11 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **THIS SCRIPT WAS STALE AND PRINTED THE OPPOSITE OF THE TRUTH.** It was
 * written on 4 September, when overlap joined on `possibility_id` alone, and
 * its own heading read *only these can converge* over a list of resolved
 * captures. **Amendment 4 (11 September) made that false**: a capture converges
 * on its words too, so the list it printed excluded exactly the rows the words
 * path exists for. A diagnostic that cannot see the common case sends the
 * reader looking in the wrong place — which is what it did.
 *
 * A convergence needs these true at once (§6, and `lib/overlap.ts`):
 *
 *   1. a MUTUAL track — both rows of `tracks`, not one
 *   2. both captures SHARED — `visibility in SHARED_SCOPES`, not `private`
 *   3. both captures LIVE — `status = 'active'`; a crossed-off line converges
 *      with nobody (`isLive`)
 *   4. and then EITHER
 *        a. both resolved to the SAME possibility, both with an intent, and the
 *           pair in `classify`'s allowlist; OR
 *        b. both UNRESOLVED (`possibility_id is null`) with identical,
 *           non-empty `normalised_text` — the words path
 *   5. neither copied from the counterpart (`source = 'self'`), which is the
 *      suppression rule
 *
 * ⚠ **Any one of them missing produces silence, and the silence is identical
 * in every case.** That is the failure mode the product is designed around, so
 * it is also the one that is hardest to debug from the app. This prints which
 * one is false.
 *
 * ⚠⚠ **IT ALSO PRINTS THE NOTIFICATIONS WITH THEIR READ STATE**, because a
 * convergence that fired and was then opened leaves the portal empty and the
 * gutter mark set — §5's *the portal is arrival, the mark is memory*. **A dark
 * door is not evidence that nothing converged**, and that distinction cost an
 * afternoon on 11 September.
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
  console.log(
    `   @${t.follower} → @${t.followed}   ${t.mutual ? 'MUTUAL ✓' : 'one-sided — the other side is missing'}`,
  )
}

/** The flags every capture line prints, in the order the rules are checked. */
const flagsFor = (c) =>
  [
    c.visibility === 'private' ? 'LOCKED (private)' : 'shared',
    c.status === 'active' ? 'active' : `${c.status} — NOT LIVE, converges with nobody`,
    c.verdict ? `verdict=${c.verdict}` : null,
    c.source !== 'self' ? `source=${c.source} — SUPPRESSED` : null,
  ].filter(Boolean)

/* Resolved captures — the possibility path, which also needs an intent. */
const resolved = await sql`
  SELECT p.handle, c.text, c.possibility_id, i.title, c.intent, c.status, c.verdict,
         c.visibility, c.source
  FROM captures c
  JOIN profiles p ON p.id = c.user_id
  LEFT JOIN items i ON i.id = c.possibility_id
  WHERE c.possibility_id IS NOT NULL
  ORDER BY i.title, p.handle
`
console.log(`\n── resolved captures (${resolved.length}) — the possibility path`)
for (const c of resolved) {
  const flags = [c.intent ?? 'NO INTENT — cannot classify', ...flagsFor(c)]
  console.log(`   @${c.handle}  "${c.text}"  →  ${c.title ?? '?'}  [${flags.join(', ')}]`)
}

/*
  Unresolved captures — the words path, Amendment 4. The empty-string exclusion
  is `fireOverlap`'s own: `???` normalises to nothing and would otherwise match
  every other punctuation-only capture in the app.
*/
const raw = await sql`
  SELECT p.handle, c.text, c.normalised_text, c.status, c.verdict, c.visibility, c.source
  FROM captures c
  JOIN profiles p ON p.id = c.user_id
  WHERE c.possibility_id IS NULL AND c.normalised_text <> ''
  ORDER BY c.normalised_text, p.handle
`
console.log(`\n── unresolved captures (${raw.length}) — the words path`)
for (const c of raw) {
  console.log(
    `   @${c.handle}  "${c.text}"  →  "${c.normalised_text}"  [${flagsFor(c).join(', ')}]`,
  )
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
if (!pairs.length) console.log('   NONE.')
for (const r of pairs) console.log(`   ${r.title}  —  ${r.who}`)

/*
  ⚠ **The same words held by more than one person, and whether BOTH sides are
  actually eligible.** Two people typing one phrase is not a convergence if one
  of them crossed it off or locked it — printing the pair without that test is
  what makes this look like a fault in the engine when it is a fault in the data.
*/
const words = await sql`
  SELECT c.normalised_text,
         string_agg(DISTINCT p.handle, ', ') AS who,
         count(DISTINCT c.user_id)::int AS holders,
         count(DISTINCT c.user_id) FILTER (
           WHERE c.status = 'active' AND c.visibility <> 'private' AND c.source = 'self'
         )::int AS eligible
  FROM captures c
  JOIN profiles p ON p.id = c.user_id
  WHERE c.possibility_id IS NULL AND c.normalised_text <> ''
  GROUP BY c.normalised_text HAVING count(DISTINCT c.user_id) > 1
  ORDER BY c.normalised_text
`
console.log(`\n── words held by more than one person (${words.length})`)
if (!words.length) console.log('   NONE — nothing for the words path to converge on.')
for (const w of words) {
  const verdict =
    w.eligible > 1 ? 'both sides eligible ✓' : `only ${w.eligible} side eligible — SILENT`
  console.log(`   "${w.normalised_text}"  —  ${w.who}  [${verdict}]`)
}

/*
  ⚠ **Read state, not just a count.** `listMyPortal` filters `read_at is null`
  and the gutter mark does not, so an opened convergence leaves a marked line
  and an empty portal. Without this column a fired-and-read convergence is
  indistinguishable from one that never happened.
*/
const notes = await sql`
  SELECT p.handle, n.kind, n.read_at, n.created_at,
         n.payload->>'normalisedText' AS words,
         n.payload->>'itemId' AS item,
         n.payload->>'counterpartName' AS who
  FROM notifications n JOIN profiles p ON p.id = n.user_id
  ORDER BY n.created_at
`
console.log(`\n── notifications written, ever: ${notes.length}`)
for (const n of notes) {
  const about = n.words ? `words "${n.words}"` : n.item ? `possibility ${n.item}` : 'no subject'
  const state = n.read_at
    ? 'READ — gone from the portal, mark remains'
    : 'UNREAD — waiting in the portal'
  console.log(
    `   @${n.handle}  ${n.kind}  ${about}  counterpart=${n.who ?? '?'}  ${state}  ` +
      `${n.created_at.toISOString().slice(0, 16)}`,
  )
}

/* Push: one subscription per device, and delivery is dark without VAPID keys. */
const subs = await sql`
  SELECT p.handle, count(*)::int AS n
  FROM push_subscriptions s JOIN profiles p ON p.id = s.user_id
  GROUP BY p.handle ORDER BY p.handle
`
console.log(`\n── push subscriptions (${subs.reduce((t, s) => t + s.n, 0)})`)
if (!subs.length) console.log('   NONE — nobody has tapped Turn on, so nothing can be delivered.')
for (const s of subs) console.log(`   @${s.handle}  ${s.n}`)

console.log(`
Reading this: a mutual track is the gate; a shared scope is what lets it out;
'active' is what keeps a crossed-off line silent; and then EITHER one
possibility with intents on both sides OR identical words with neither side
resolved. A copied capture is suppressed on purpose.

⚠ An UNREAD notification is what puts a line in the portal and lights the door.
A READ one leaves only the gutter mark — so a dark door over marked lines means
it fired and was opened, not that it never fired.`)
