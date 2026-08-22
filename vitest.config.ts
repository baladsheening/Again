import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config({ path: '.env.local', quiet: true })

/**
 * §13's two tests, and the one that guards the vocabulary rule. Nothing else.
 *
 * This is deliberately not a test suite. Every fault that has actually mattered in
 * this project — an intent sheet behind a dropdown, a dead ×, three iOS keyboard
 * mechanisms — was found by driving the app and looking at it, and no unit test
 * would have caught any of them. What lives here is the opposite case: the
 * guarantees that fail with **no symptom at all**, where a passing build, a passing
 * typecheck and a screen that looks right are all consistent with the guarantee
 * being gone.
 *
 * ⚠ `vocabulary.test.ts` needs no database, and must not grow one — it lints
 * text through the flat config and asserts which identifiers the rule rejects.
 *
 * ⚠ **It runs against the `development` branch**, through `.env.local`. It writes,
 * so it must never be pointed at production; `guarantees.test.ts` refuses to run if
 * `DATABASE_URL` is the production host.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The data layer is `import 'server-only'`, which throws outside a React
    // server build. This is the condition that resolves it to the empty module —
    // the same one Next sets — rather than stubbing the import.
    server: { deps: { inline: true } },
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      /*
        ⚠ `server-only` is not an installed package — Next resolves it through its
        own conditions. Outside a Next build there is nothing to resolve, so the
        data layer cannot be imported at all without this. The guard's purpose is to
        stop a *client bundle* pulling in `lib/db/`; a test process is not one, so
        standing it down here removes nothing the rule was protecting.
      */
      'server-only': fileURLToPath(new URL('./tests/server-only.stub.ts', import.meta.url)),
    },
  },
})
