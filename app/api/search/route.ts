import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { searchFilms } from '@/lib/tmdb'
import { TmdbError } from '@/lib/tmdb'

/**
 * The TMDB proxy (§10). The credential is server-side only and never reaches a
 * client bundle; this route is the only way in.
 *
 * A route handler rather than a Server Action because the input box fires on
 * every keystroke: this is cancellable with `AbortController` and cacheable,
 * neither of which a Server Action gives you.
 */

/**
 * One character is a valid query — see `MIN_QUERY` in
 * `components/search-provider.tsx` for why, and note that this is one of three
 * places the floor lives.
 */
const querySchema = z.object({
  q: z.string().min(1).max(120),
})

export async function GET(request: Request) {
  // Authenticated only. An open proxy would be someone else's free TMDB quota.
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const parsed = querySchema.safeParse({
    q: new URL(request.url).searchParams.get('q') ?? '',
  })

  // Too short is not an error — it is what every query looks like on the way to
  // being long enough.
  if (!parsed.success) return NextResponse.json({ results: [] })

  // Per user and per IP (§10). Two accounts behind one connection should not
  // double the budget.
  for (const identifier of [sessionUser.id, clientIp(request.headers)]) {
    const limit = await rateLimit('search', identifier)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'rate_limited' },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        },
      )
    }
  }

  try {
    const results = await searchFilms(parsed.data.q)
    return NextResponse.json(
      { results },
      // Private: results are identical for everyone, but the request is
      // authenticated and shared caches should not hold it.
      { headers: { 'Cache-Control': 'private, max-age=60' } },
    )
  } catch (cause) {
    if (cause instanceof TmdbError) {
      return NextResponse.json({ error: 'upstream_unavailable' }, { status: 503 })
    }
    throw cause
  }
}
