import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/lib/auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const handlers = toNextJsHandler(auth)

/**
 * §10 rate limits auth, and `LIMITS.auth` had been declared since Phase 0
 * without anything calling it. Better Auth ships its own limiter, but it
 * defaults to in-memory storage, which on Vercel means per-instance — the same
 * hole `lib/rate-limit.ts` documents about the Upstash fallback. Going through
 * ours means one limiter to configure and one place to read.
 *
 * Only the endpoints that cost something are listed. `/get-session` runs on
 * ordinary navigation and must never be throttled, which is the mistake a blunt
 * "limit everything under /api/auth" would make.
 *
 * The two reset paths are here because they send email. Unthrottled they are a
 * way to fill a stranger's inbox using your domain's reputation.
 */
const RATE_LIMITED = new Set([
  '/sign-in/email',
  '/sign-up/email',
  '/request-password-reset',
  '/forget-password',
  '/reset-password',
])

export const GET = handlers.GET

export async function POST(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, '')

  if (RATE_LIMITED.has(path)) {
    const limit = await rateLimit('auth', clientIp(request.headers))

    if (!limit.ok) {
      // Deliberately says nothing about which account or whether it exists.
      return Response.json(
        { message: 'Too many attempts. Try again shortly.' },
        {
          status: 429,
          headers: { 'retry-after': String(limit.retryAfterSeconds) },
        },
      )
    }
  }

  return handlers.POST(request)
}
