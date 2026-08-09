import { redirect } from 'next/navigation'

import { PosterWall } from '@/components/poster-wall'
import { SearchField } from '@/components/search-field'
import { getMyProfile, getSessionUser } from '@/lib/db'
import type { FilmSearchResult } from '@/lib/domain'
import { inCinemas } from '@/lib/tmdb'

/**
 * Home: what is on, and what is about to be.
 *
 * `/` was the capture box alone for about an hour on 9 August, and before that
 * it was Wants. It is the poster wall now — see `components/poster-wall.tsx` for
 * why that is a capture prompt rather than the discovery feature §2 rules out,
 * and `docs/decisions.md` for what it costs.
 *
 * **The search field is here only at rail widths.** Below them it lives in the
 * bottom bar, where a thumb can reach it; putting it in both places would mean
 * two fields with two pieces of state and one of them always stale.
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

  let films: FilmSearchResult[] = []
  try {
    films = await inCinemas()
  } catch (cause) {
    console.error('Home: TMDB listings unavailable', cause)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rail:block hidden">
        <SearchField placement="page" />
      </div>

      <PosterWall films={films} />
    </div>
  )
}
