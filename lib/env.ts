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

  // Phase 1
  TMDB_API_KEY: z.string().optional(),

  // Phase 5
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
