import 'server-only'

import { z } from 'zod'

/**
 * Server environment. Per the Next.js data-security guide, only the data-access
 * layer and its immediate dependencies read `process.env` — nothing else in the
 * app touches it directly.
 *
 * Phase-gated: variables a phase does not need yet are optional, so the app
 * boots on a partial `.env.local`. Each is promoted to required in the phase
 * that introduces it.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // Phase 1. The Read Access Token (Bearer), not the v3 API key — see .env.example.
  TMDB_READ_ACCESS_TOKEN: z.string().optional(),

  /*
    Phase 0.5. Optional here and required at deploy time by scripts/preflight.mjs,
    because development deliberately runs without them: with no key, reset links
    print to the terminal, which is currently the only way into an account.

    EMAIL_FROM is not `.email()` — it carries a display name, "Again <you@…>".
  */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  /*
    Phase 6 — and the numbering is the point. These read `Phase 5` until 25
    August, from `docs/plan.md`'s film-first sequence; the re-direction
    renumbered the phases and moved push delivery to the last one, behind adult
    eligibility, consent, blocking, reporting and moderation
    (implementation-spec.md §"Phase 6"). Notifications are in-app first, so
    `lib/overlap.ts` writing `notifications` rows with nothing delivering them
    is the designed state rather than a gap.

    ⚠ **The keys are gone from Vercel, deliberately, on 25 August.** They sat
    unread in production and preview for seventeen days for a phase that had
    moved. Nothing was bound to them — `push_subscriptions` cannot hold a row
    without a service worker to create one — so Phase 6 generates a fresh pair
    with `npx web-push generate-vapid-keys` and promotes these to required in
    the same commit. They stay optional here so nothing breaks in between.
  */
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`Invalid environment.\n${missing}\n\nSee .env.example.`)
}

export const env = parsed.data
