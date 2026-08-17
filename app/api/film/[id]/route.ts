import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionUser, listMyEntriesForExternalId } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { getFilm, TmdbError } from '@/lib/tmdb'

/**
 * One film, for the screen that opens when a poster is tapped.
 *
 * **Two questions, one round trip.** What is this film, and is it already on your
 * list — the first from TMDB, the second from `lib/db/`. They arrive together
 * because the screen cannot draw either half without both: a `+` that turns into
 * a tick a moment later, once a second request lands, is a control that lies for
 * as long as the network takes.
 *
 * A route handler rather than a Server Action for the same reason `/api/search`
 * is one: this is a read the client fires on a gesture, and it wants
 * `AbortController` and a cache, neither of which an action gives you. TMDB's
 * credential stays server-side either way (§10).
 *
 * ⚠ **`private` in `Cache-Control`, and here it is load-bearing rather than
 * cautious.** `/api/search` says private because the request is authenticated
 * even though the answer is the same for everyone. This answer is *not* the same
 * for everyone — half of it is your own list — so a shared cache holding it would
 * be handing one person another person's state.
 */

const paramsSchema = z.object({
  // TMDB ids are numeric strings, same bound as `addSchema` in the entry action.
  id: z.string().regex(/^\d{1,12}$/),
})

export async function GET(request: Request, ctx: RouteContext<'/api/film/[id]'>) {
  // Authenticated only. An open proxy would be someone else's free TMDB quota,
  // and this one would also answer questions about a stranger's list.
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const parsed = paramsSchema.safeParse(await ctx.params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  /*
    The `search` bucket rather than one of its own. It is the same upstream quota
    being spent, and a second bucket would let a script spend the budget twice by
    alternating between two endpoints — which is the thing a limit is for.
  */
  for (const identifier of [sessionUser.id, clientIp(request.headers)]) {
    const limit = await rateLimit('search', identifier)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      )
    }
  }

  try {
    const film = await getFilm(parsed.data.id)
    if (!film) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const listed = await listMyEntriesForExternalId(sessionUser, {
      kind: 'film',
      externalId: parsed.data.id,
    })

    return NextResponse.json(
      { film, listed },
      /*
        Short, because the second half of this goes stale the moment you add
        something. Sixty seconds is what stops a double-tap costing two round
        trips; anything longer and reopening a film you just added would show you
        a `+` for a row that exists.
      */
      { headers: { 'Cache-Control': 'private, max-age=15' } },
    )
  } catch (cause) {
    if (cause instanceof TmdbError) {
      return NextResponse.json({ error: 'upstream_unavailable' }, { status: 503 })
    }
    throw cause
  }
}
