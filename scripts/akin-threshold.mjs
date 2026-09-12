/**
 * **What distance is "nearly the same thing"** — 12 September.
 *
 * `AKIN_DISTANCE` in `lib/akin.ts` is the one tuned number in the akin feature,
 * and its docblock says plainly that 0.35 is a starting point rather than a
 * measurement, **because measuring it needs the key.** This is how it gets
 * measured. Give it pairs you would and would not want grouped; it prints the
 * cosine distance between each and where the current threshold falls.
 *
 * ⚠ **It costs money to run** — one embedding per line, fractions of a cent —
 * and it is the only thing in this repository that does. It is a script rather
 * than a test for exactly that reason: the suite must stay free and offline.
 *
 * Run:  node scripts/akin-threshold.mjs
 *       node scripts/akin-threshold.mjs "learn to sail" "sailing lessons"
 */
import { readFileSync } from 'node:fs'

/* `.env.local` by hand: this runs under plain node, outside Next. */
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const KEY = process.env.VOYAGE_API_KEY
if (!KEY) {
  console.error(
    'VOYAGE_API_KEY is unset. Until it is, the feature is dark by design — see lib/env.ts.',
  )
  process.exit(1)
}

/* Keep in step with `lib/embed.ts`. Two literals, and this is the cheap one. */
const MODEL = 'voyage-4-lite'
const THRESHOLD = 0.35

/**
 * ⚠ **The pairs are the judgement and the numbers are only evidence.** The left
 * column is what should group; the right is what must not. A threshold that
 * admits anything on the right is wrong however good it looks on the left —
 * **a wrong grouping is the app making a claim about somebody's own record that
 * they can see is false.**
 */
const SHOULD = [
  ['learn to sail', 'sailing lessons'],
  ['buy a film camera', 'get into photography'],
  ['try pottery', 'pottery class'],
  ['a trip to Japan', 'travel to Japan next spring'],
  ['read more history', 'history books'],
]

const SHOULD_NOT = [
  ['learn to sail', 'learn French'],
  ['try pottery', 'try surfing'],
  ['a trip to Japan', 'a trip to the dentist'],
  ['buy a film camera', 'buy milk'],
  ['read more history', 'read the lease'],
]

const embed = async (texts) => {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ input: texts, model: MODEL }),
  })
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
  const body = await response.json()
  return body.data.map((d) => d.embedding)
}

/** Voyage's vectors are unit length, so this is 1 − dot product. */
const distance = (a, b) => 1 - a.reduce((sum, n, i) => sum + n * b[i], 0)

const args = process.argv.slice(2)
const pairs =
  args.length >= 2
    ? [[args[0], args[1]]]
    : [...SHOULD.map((p) => [...p, 'should']), ...SHOULD_NOT.map((p) => [...p, 'should not'])]

const texts = [...new Set(pairs.flatMap(([a, b]) => [a, b]))]
const vectors = await embed(texts)
const byText = new Map(texts.map((t, i) => [t, vectors[i]]))

console.log(`\n${MODEL}, threshold ${THRESHOLD}\n`)
let wrong = 0
for (const [a, b, want] of pairs) {
  const d = distance(byText.get(a), byText.get(b))
  const grouped = d < THRESHOLD
  const verdict = want ? (grouped === (want === 'should') ? '   ' : ' ✗ ') : '   '
  if (verdict === ' ✗ ') wrong += 1
  console.log(
    `${verdict}${d.toFixed(4)}  ${grouped ? 'GROUPED    ' : 'not grouped'}  ${a}  ·  ${b}`,
  )
}

if (pairs.length > 1) {
  console.log(
    `\n${pairs.length - wrong}/${pairs.length} land where they should at ${THRESHOLD}.`,
  )
  console.log(
    'Pick the threshold that separates the two lists, then set AKIN_DISTANCE in lib/akin.ts.',
  )
}
