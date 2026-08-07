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
    ignores: ['lib/db/**', 'lib/auth.ts', 'lib/overlap.ts', 'drizzle.config.ts'],
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
    name: 'again/vocabulary',
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
      ],
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'drizzle/**']),
])

export default eslintConfig
