import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Words that must never appear in the UI or in code identifiers. The naming is
 * load bearing: each banned word imports a model the product is deliberately
 * not. See CLAUDE.md, "Re-direction vocabulary", and §3 of
 * docs/re-direction/implementation-spec.md for the words that replace them.
 *
 * ⚠ **Two words came off this list in Phase 0, and neither is an oversight.**
 *
 * `saved` was named in the rule's *message* but was never in its pattern —
 * which is the only reason the specification is implementable, because saving
 * is the new product's central verb ("pressing Return saves the text",
 * "optimistic save and undo"). Anyone reconciling the message to the pattern
 * would have banned the capture flow. The message now states the actual rule.
 *
 * `score` is required by §7: the internal reliability score may rank results,
 * while the interface must speak the evidence states instead. A linter cannot
 * tell a ranking value from a rendered number, so this rule no longer claims
 * to — the guarantee is the state list in §7, not the pattern below.
 */
const BANNED_WORDS = [
  'recommendation',
  'review',
  'rating',
  'favourite',
  'favorite',
  'bookmark',
  'feed',
]

/**
 * A word is banned as a **word**, not as a run of letters that happens to
 * appear inside one.
 *
 * The pattern used to be unanchored, so it read `migrating` as *rating* and
 * `preview` as *review*. Both are words Phase 0 and Phase 1 are written in —
 * a data migration and an image preview — and CLAUDE.md requires that this
 * rule never block an implementation the specification asks for. `hydrating`,
 * `operating` and `underscore` were waiting behind them.
 *
 * So a banned word must *begin* a segment and *end* one, give or take an
 * inflection. The inflections keep `reviews`, `bookmarked` and `Ratings`
 * caught; the ending is what lets `feedback` through, which is a different
 * word from `feed` and the reason an end constraint is needed at all.
 *
 * ⚠ **A segment ends differently in `SCREAMING_SNAKE`, and this is where the
 * first attempt was wrong.** `camelCase` marks a new segment with a capital,
 * so "not followed by a lowercase letter" ends a word there — but in all caps
 * every letter is a capital and the only separator is `_`, so that same test
 * read `FEEDBACK` as `FEED` while `feedback` passed. The three casings are
 * therefore three branches with two different endings: the lower and
 * capitalised forms end where a lowercase letter stops, and the all-caps form
 * ends only where letters stop.
 *
 * ⚠ **`String.raw` is load bearing.** In an ordinary template literal `\d` is
 * not an escape sequence, so it evaluates to a bare `d` — the boundary set
 * becomes start, `_`, or the letter d, and `hydrating` is a *rating* again.
 */
const INFLECTIONS = '(?:s|d|ed|es|ing|er|ers)?'

const CAPS_INFLECTIONS = '(?:S|D|ED|ES|ING|ER|ERS)?'

const segmentStart = (word) => {
  const capitalised = `${word[0].toUpperCase()}${word.slice(1)}`

  return [
    String.raw`(?:^|_|\d)${word}${INFLECTIONS}(?![a-z])`,
    String.raw`${capitalised}${INFLECTIONS}(?![a-z])`,
    String.raw`(?:^|_|\d)${word.toUpperCase()}${CAPS_INFLECTIONS}(?![A-Za-z])`,
  ].join('|')
}

const BANNED_VOCABULARY = new RegExp(
  BANNED_WORDS.map((word) => `(?:${segmentStart(word)})`).join('|'),
)

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: 'again/data-access-boundary',
    /**
     * §3, the single most important structural rule in the build: the database
     * is never reachable from the client, and every query goes through
     * `lib/db/`. There is no RLS backstop, so a query that forgets to filter is
     * caught here or not at all.
     */
    /*
      `tests/**` is exempt for one reason, and it is the reason the tests exist:
      they arrange their fixtures with the raw driver so that a bug in `lib/db/`
      cannot quietly set up the conditions its own guarantee is being checked
      against. A test that inserted a private note *through* the layer would be
      asking the layer whether it agrees with itself.
    */
    ignores: [
      'lib/db/**',
      'lib/auth.ts',
      'lib/overlap.ts',
      'drizzle.config.ts',
      'tests/**',
      'vitest.config.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'drizzle-orm',
              message:
                'Query through lib/db/ instead. No Server Component, Server Action or route handler may query Drizzle directly (§3).',
            },
            {
              name: '@neondatabase/serverless',
              message: 'The database handle belongs to lib/db/ (§3).',
            },
          ],
          patterns: [
            {
              group: ['**/lib/db/client', '@/lib/db/client', './client', '../client'],
              message:
                'Import the data-access functions from @/lib/db, not the Drizzle handle (§3).',
            },
            {
              group: ['**/lib/db/schema', '@/lib/db/schema'],
              message:
                'Import domain types from @/lib/db. Table objects stay inside the data-access layer (§3).',
            },
          ],
        },
      ],
    },
  },

  {
    /**
     * Two unrelated bans, in one block because they have to be.
     *
     * `no-restricted-syntax` takes one options array, and a later flat-config
     * object *replaces* an earlier one's options rather than merging them — so
     * a second block adding the style rule would silently switch the vocabulary
     * rule off for every file both blocks covered. One block, two selectors.
     */
    name: 'again/restricted-syntax',
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    ignores: ['lib/vocabulary.ts', 'eslint.config.mjs'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Identifier[name=${BANNED_VOCABULARY}]`,
          message:
            'Banned vocabulary: recommendation, review, rating, favourite, bookmark, feed. Banned as words — a banned word inside a longer one (preview, migrating, feedback) is fine. See CLAUDE.md, "Re-direction vocabulary", for the words that replace them.',
        },
        /**
         * **A `style` attribute does not survive the CSP, and fails only in
         * production.**
         *
         * `proxy.ts` sets `style-src 'self' 'nonce-…'` with no `unsafe-inline`
         * (§10). A nonce whitelists a `<style>` element; there is nowhere on an
         * *attribute* to put one, so the browser drops every server-rendered
         * `style="…"`. `next dev` adds `unsafe-inline`, so the failure is
         * invisible until it is deployed — which is how the masthead shipped
         * without its safe-area padding and the wordmark without its trims
         * (found 10 August).
         *
         * Use a class: Tailwind's arbitrary values cover `pt-[calc(…)]` and its
         * arbitrary *properties* cover `[--safe-bottom-base:3rem]`, both of
         * which compile to real stylesheet rules. Anything with a name worth
         * reading belongs in `app/globals.css` as a `@utility`.
         *
         * ⚠ This bans the attribute, not the CSSOM. `el.style.transform = …`
         * from an effect is unaffected — CSP governs attribute parsing — and
         * `useKeyboardPin` in `components/shell.tsx` depends on that.
         */
        {
          selector: 'JSXAttribute[name.name="style"]',
          message:
            'Inline style attributes are blocked by the CSP in production and nowhere else (§10). Use a class — Tailwind arbitrary values and arbitrary properties both compile to real rules. See app/globals.css.',
        },
      ],
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'drizzle/**']),
])

export default eslintConfig
