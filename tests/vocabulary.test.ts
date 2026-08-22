import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * The third test, and it is here for the reason the other two are: it fails
 * with no symptom.
 *
 * The vocabulary rule is the only place the product's language is enforced,
 * and both ways it can break are silent. A pattern that stops matching leaves
 * lint, typecheck and every screen exactly as they were. A pattern that
 * matches too much is worse, because it is discovered as a build error inside
 * whatever feature was unlucky — which is how `migrating` and `preview`, both
 * of them words the re-direction is written in, were banned for months by a
 * rule that meant to ban `rating` and `review`.
 *
 * ⚠ The rule's regex is now *built* from a word list rather than written out,
 * so a change to the builder changes every word at once. That is what this
 * table is watching, and why every word appears in more than one casing:
 * `camelCase`, `snake_case` and `SCREAMING_SNAKE` do not end a segment the
 * same way, and the first attempt at this rule got the third one wrong —
 * `feedback` passed while `FEEDBACK` was rejected as `FEED`.
 */

/*
  ESLint reads the flat config from the working directory, which is the repo
  root under vitest. The path is never opened — `lintText` only needs it to
  decide which config blocks apply — but it must be one the vocabulary block
  covers and does not ignore.
*/
const FILE = 'lib/vocabulary-probe.ts'

const BANNED = [
  'review',
  'userReview',
  'reviews',
  'reviewer',
  'REVIEW_STATE',
  'rating_value',
  'ratings',
  'isFavourite',
  'favoritesById',
  'bookmarked',
  'activityFeed',
  'feeds',
  'recommendationEngine',
  'REVIEWS',
  'BOOKMARKED',
  'ACTIVITY_FEED',
  'RECOMMENDATION_ENGINE',
]

/*
  Half of these are the words the re-direction spec is written in, and half are
  ordinary English that happens to contain a banned word. Both halves have to
  pass, and the second half is the one that has been wrong before.
*/
const PERMITTED = [
  'captureId',
  'possibilities',
  'claims',
  'offerExpiry',
  'occurrence',
  'intention',
  'transferSession',
  'convergence',
  'savedAt',
  'isSaved',
  'relevanceScore',
  'migrating',
  'isMigrating',
  'migrationRunner',
  'previewUrl',
  'isHydrating',
  'operating',
  'underscores',
  'feedback',
  'feedbackForm',
  'FEEDBACK',
  'FEEDBACK_FORM',
  'MIGRATING',
  'PREVIEW_URL',
]

let eslint: ESLint

beforeAll(() => {
  eslint = new ESLint()
})

async function violations(identifier: string): Promise<string[]> {
  const [result] = await eslint.lintText(`const ${identifier} = 1\nexport default ${identifier}\n`, {
    filePath: FILE,
  })

  return result.messages
    .filter((message) => message.ruleId === 'no-restricted-syntax')
    .map((message) => message.message)
}

describe('the vocabulary rule', () => {
  it.each(BANNED)('rejects %s', async (identifier) => {
    expect(await violations(identifier)).not.toHaveLength(0)
  })

  it.each(PERMITTED)('permits %s', async (identifier) => {
    expect(await violations(identifier)).toHaveLength(0)
  })
})
