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
  /**
   * ⚠⚠ **AMENDMENT 10 MOVED PUSH INTO RELEASE 1 — 11 September — SO THE BLOCK
   * ABOVE IS HISTORY RATHER THAN THE RULE.** It is not wrong about what it was
   * written for: **Phase 6 gates STRANGER matching** behind adult eligibility,
   * blocking, reporting and moderation. **None of that is in the path here.** A
   * push only ever carries a convergence or a request between two people who
   * are already mutually tracked, or who have already asked — *an earned
   * service-notification path belongs in Release 1*, in the amendment's words.
   *
   * ⚠ **All three stay OPTIONAL, and that is what keeps the app whole without
   * them.** `lib/push.ts` checks before it configures `web-push`, so a machine
   * with no keys runs every screen and simply does not buzz — the state
   * `lib/env.ts` has described since 25 August, now with something on the other
   * end of it. **Promoting them to required is `scripts/preflight.mjs`'s call
   * when the beta actually needs delivery**, not this file's.
   *
   * ⚠ **The public key is `NEXT_PUBLIC_` because the browser needs it** —
   * `pushManager.subscribe` takes it as the application server key, so it is
   * public by design and is in the client bundle. **The private key must never
   * acquire that prefix**; it is what signs the VAPID token.
   */
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  /**
   * **Voyage AI, for the akin grouping** — 12 September, directed.
   *
   * ⚠ **Optional, on the VAPID keys' own precedent and for the same reason.**
   * The app has to be whole without it: with no key nothing is embedded, no
   * pair is written, no asterisk is drawn, and no screen says anything is
   * missing. **Adding the key turns the feature on for captures written from
   * then on**; the rows already in the record have no vector and stay
   * ungrouped until something re-embeds them.
   *
   * ⚠ **No `NEXT_PUBLIC_` prefix, ever.** It is a billable credential and
   * everything it does happens in an `after()` on the server. §10: provider
   * credentials remain server-side only.
   *
   * See `lib/embed.ts`, which is the only reader.
   */
  VOYAGE_API_KEY: z.string().optional(),

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
