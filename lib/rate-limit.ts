import 'server-only'

import { env } from '@/lib/env'

/**
 * Fixed-window rate limiting (§10): per user and per IP on auth, entry
 * creation, the TMDB proxy and swap initiation.
 *
 * Implemented directly against Upstash's REST API rather than pulling in
 * `@upstash/ratelimit` and `@upstash/redis` — §10 says no dependency without a
 * reason written down, and a fixed window is INCR plus EXPIRE.
 *
 * ⚠ Without Upstash configured this falls back to an in-process Map. That is
 * fine in development and **is not real protection in production**, where
 * serverless instances each get their own memory and an attacker simply lands
 * on a different one. `assertRateLimitConfigured()` is called at the point of
 * deploy readiness; see DECISIONS.md.
 */

export type Limit = { requests: number; windowSeconds: number }

export const LIMITS = {
  auth: { requests: 10, windowSeconds: 60 },
  search: { requests: 30, windowSeconds: 60 },
  entryCreate: { requests: 60, windowSeconds: 60 },
  swapInitiate: { requests: 5, windowSeconds: 300 },
} as const satisfies Record<string, Limit>

export type LimitName = keyof typeof LIMITS

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number }

const usingUpstash = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
)

/** True when limits are backed by shared state and therefore actually enforced. */
export function rateLimitIsDurable(): boolean {
  return usingUpstash
}

export async function rateLimit(
  name: LimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const limit = LIMITS[name]
  const window = Math.floor(Date.now() / 1000 / limit.windowSeconds)
  const key = `rl:${name}:${identifier}:${window}`

  const count = usingUpstash
    ? await incrUpstash(key, limit.windowSeconds)
    : incrMemory(key, limit.windowSeconds)

  if (count <= limit.requests) return { ok: true }

  const elapsed = Math.floor(Date.now() / 1000) % limit.windowSeconds
  return { ok: false, retryAfterSeconds: limit.windowSeconds - elapsed }
}

async function incrUpstash(key: string, ttl: number): Promise<number> {
  try {
    const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(ttl), 'NX'],
      ]),
      cache: 'no-store',
    })

    if (!res.ok) return 0 // fail open: a limiter outage must not take the app down
    const body = (await res.json()) as Array<{ result?: number }>
    return body[0]?.result ?? 0
  } catch {
    return 0
  }
}

const memory = new Map<string, { count: number; expiresAt: number }>()

function incrMemory(key: string, ttl: number): number {
  const now = Date.now()

  // Opportunistic sweep; the map is only ever as large as one window's traffic.
  if (memory.size > 10_000) {
    for (const [k, v] of memory) if (v.expiresAt <= now) memory.delete(k)
  }

  const existing = memory.get(key)
  if (!existing || existing.expiresAt <= now) {
    memory.set(key, { count: 1, expiresAt: now + ttl * 1000 })
    return 1
  }

  existing.count += 1
  return existing.count
}

/**
 * The IP to limit on. Vercel sets `x-forwarded-for`; the leftmost entry is the
 * client. Falls back to a constant, which limits everyone together rather than
 * nobody — the safer failure.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headers.get('x-real-ip') ?? 'unknown'
}
