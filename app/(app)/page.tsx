import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { CinemaWall } from '@/components/cinema-wall'
import { PosterWall } from '@/components/poster-wall'
import { getMyProfile, getSessionUser } from '@/lib/db'
import { viewerRegion } from '@/lib/region'
import { inCinemas, type CinemaListing } from '@/lib/tmdb'

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
 * both layouts reach it the same way — the phone from its masthead, the desk
 * from the column — and so the wall is the whole of the screen it is on.
 *
 * TMDB failing is not an error page. The wall is a prompt, and a prompt that
 * cannot be drawn should leave the rest of the app working — so the failure
 * degrades to an empty wall with search still available, and is logged rather
 * than thrown.
 */

/**
 * ⚠ **Temporary, and it is the only reason the probe is reachable installed.**
 * Goes with `Probe` at the foot of `components/film-screen.tsx`.
 *
 * From iOS 16.4 Safari takes the manifest's `start_url` when a page is added to
 * the Home Screen, so an icon added from `/?probe` opens `/` and the flag is
 * gone before the app has painted a frame. The block never appeared, and the
 * screen looked instrumented when it was not.
 *
 * A second manifest, linked only while the flag is present, names `/?probe` as
 * its own `start_url`. The icon then carries the flag into standalone, which
 * has no address bar to type it into. `app/manifest.ts` is untouched, so the
 * real app installs exactly as before.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<'/'>): Promise<Metadata> {
  const probing = 'probe' in (await searchParams)
  return probing ? { manifest: '/probe.webmanifest' } : {}
}

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
  let listing: CinemaListing = { nowShowing: [], comingSoon: [] }
  try {
    listing = await inCinemas(await viewerRegion())
  } catch (cause) {
    console.error('Home: TMDB listings unavailable', cause)
  }

  const { nowShowing, comingSoon } = listing

  /*
    **The page's heading is `sr-only`, and the visible caption is not it.** The
    caption names whichever half of the wall you are looking at and changes as
    you scroll, so it describes a moment rather than a page — which is the one
    thing an `<h1>` may not do. A quiet line saying what the whole screen is
    costs nothing and holds still.

    ⚠ **It read *In cinemas and coming soon* until 16 August, and that was the
    same false claim one layer down.** D1 was answered `no` — the app is not
    cinema-aware, TMDB knows release dates and not screens — and the visible
    caption went with it (see `CAPTION` in `components/cinema-wall.tsx`).
    Removing a sentence from the screen while leaving it in the accessibility
    tree would be hiding the claim rather than dropping it. *New releases* is
    what the data can carry: the first half is TMDB's recent-release window for
    this country and the second is dated but unreleased.

    ⚠ **The country is absent from the heading and present in the request**, and
    the two have been confused once already. `viewerRegion()` still goes to TMDB
    and the wall is still this country's releases; what was cut on 15 August is
    the *word*, not the filtering. The cost of losing it is that a wrong guess
    from an IP is now silent — see docs/decisions.md.
  */
  return (
    <>
      <h1 className="sr-only">New releases and coming soon</h1>

      {nowShowing.length === 0 && comingSoon.length === 0 ? (
        /* One empty state rather than a caption over nothing. */
        <PosterWall films={[]} />
      ) : (
        <CinemaWall nowShowing={nowShowing} comingSoon={comingSoon} />
      )}
    </>
  )
}
