import { redirect } from 'next/navigation'

import { PosterWall } from '@/components/poster-wall'
import { getMyProfile, getSessionUser } from '@/lib/db'
import type { FilmSearchResult } from '@/lib/domain'
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
 * One labelled half of the wall.
 *
 * **The heading is sticky, so one label is on screen the whole way down.** As
 * *Coming soon* arrives it pushes *In cinemas* out and takes the top — which is
 * how a list section header behaves on a phone, and needs no scroll listener, no
 * state and no client component to do it. The sections are adjacent for that
 * reason: the spacing between them is `pb` *inside* the first, so the second
 * heading arrives the instant the first section's box ends. A gap between them
 * would leave a moment with no label pinned at all.
 *
 * ⚠ **It sits below the masthead deliberately, at `z-10` against its `z-20`.**
 * So while the masthead is up the label is behind it, and it appears as the
 * masthead recedes — which is to say it is there exactly while you are scrolling
 * down through posters, and gives the top strip back to the mark when you scroll
 * up. `main` carries `isolate`, so that ordering is guaranteed rather than a
 * coincidence of two numbers in different stacking contexts.
 *
 * `bg-bg` because a pinned label with no ground has posters sliding through the
 * letters.
 */
function Section({ title, films }: { title: string; films: FilmSearchResult[] }) {
  return (
    <section className="pb-6">
      <h2 className="micro text-muted bg-bg sticky top-0 z-10 py-3">{title}</h2>
      <PosterWall films={films} />
    </section>
  )
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
    **The page's heading is `sr-only`, and the two visible ones are its
    sections.** That is the honest structure: the labels below name halves of the
    wall rather than the page, and stating what the page is once, invisibly, is
    cheaper than promoting one section to stand for both.

    The country is deliberately absent. It was in this line for a few hours on
    15 August — the wall named the country its release dates were filtered to, so
    that a wrong guess from an IP would read as wrong rather than as baffling —
    and it was cut back to the two words on instruction. What that costs is
    written down in docs/decisions.md; putting it back is this string.
  */
  return (
    <>
      <h1 className="sr-only">In cinemas and coming soon</h1>

      {nowShowing.length === 0 && comingSoon.length === 0 ? (
        /* One empty state rather than two, since neither half has anything. */
        <PosterWall films={[]} />
      ) : (
        <>
          {nowShowing.length > 0 && <Section title="In cinemas" films={nowShowing} />}
          {comingSoon.length > 0 && <Section title="Coming soon" films={comingSoon} />}
        </>
      )}
    </>
  )
}
