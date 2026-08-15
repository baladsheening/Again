import { redirect } from 'next/navigation'

import { PosterWall } from '@/components/poster-wall'
import { getMyProfile, getSessionUser } from '@/lib/db'
import type { FilmSearchResult } from '@/lib/domain'
import { viewerRegion } from '@/lib/region'
import { inCinemas } from '@/lib/tmdb'

/**
 * Home: what is on, and what is about to be.
 *
 * `/` was the capture box alone for about an hour on 9 August, and before that
 * it was Wants. It is the poster wall now — see `components/poster-wall.tsx` for
 * why that is a capture prompt rather than the discovery feature §2 rules out,
 * and `docs/decisions.md` for what it costs.
 *
 * **Search is not on this page at any width.** It lived here at rail widths, as
 * a bordered field above the wall; it moved into the rail on 9 August so that
 * both layouts reach it the same way — the phone from its bottom bar, the desk
 * from the column — and so the wall is the whole of the screen it is on.
 *
 * TMDB failing is not an error page. The wall is a prompt, and a prompt that
 * cannot be drawn should leave the rest of the app working — so the failure
 * degrades to an empty wall with search still available, and is logged rather
 * than thrown.
 */
export default async function HomePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  /*
    The region is passed in rather than reached for inside `lib/tmdb.ts`, which
    is the same shape as `lib/db/` taking the `SessionUser` as an argument: the
    module that talks to an upstream service does not also decide who is asking.
    It keeps `inCinemas()` a pure function of its arguments, and therefore
    testable without a request.
  */
  let films: FilmSearchResult[] = []
  try {
    films = await inCinemas(await viewerRegion())
  } catch (cause) {
    console.error('Home: TMDB listings unavailable', cause)
  }

  return <PosterWall films={films} />
}
