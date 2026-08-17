import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Words that must never appear in the UI or in code identifiers (§4). The
 * naming is load bearing: "go-back-to" states the entry criterion, and the
 * banned words all import a model the product is deliberately not.
 */
const BANNED_VOCABULARY =
  /(recommendation|review|rating|score|favourite|favorite|bookmark)/i

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
            'Banned vocabulary (§4). Never use: recommendation, review, rating, score, favourite, saved, bookmark, feed.',
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
