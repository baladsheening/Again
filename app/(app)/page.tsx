import { redirect } from 'next/navigation'

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
 * The line above the wall, which is also the page's heading.
 *
 * **It exists because the wall was mute.** Forty posters with nothing saying
 * what they are, why these, or how far ahead they run — reported 15 August, and
 * correctly. It is one line rather than two section headings: the wall sorts
 * outward from today in both directions (see `inCinemas`), and headings would
 * mean splitting that back into blocks to label them.
 *
 * ⚠ **Every clause has to be true, and one tempting one is not.** *Showing near
 * you* would be false: TMDB filters by release dates in a country, not by what
 * is on a screen anywhere. A film released here six weeks ago stays in the
 * listing after it has left every cinema, and tonight's repertory screening of
 * something from 1974 is not in it at all. The caption says where and when, and
 * claims nothing about a venue.
 *
 * **Naming the country is not decoration.** The region is guessed from an IP
 * (`viewerRegion`), so it is occasionally wrong — and when it is, this line is
 * the only thing that makes a strange-looking wall legible instead of baffling.
 * `Intl.DisplayNames` is in the runtime, so no table of country names and no
 * dependency.
 *
 * **Assembled from clauses rather than written as a sentence**, because either
 * half can be missing: no region off Vercel, no dates if TMDB reshapes the
 * envelope. Each absence drops a clause and the rest still reads.
 *
 * A preposition is deliberately avoided — *in the United Kingdom* needs an
 * article that *in France* does not, and that is a table of exceptions to
 * maintain for no gain over a dash.
 */
function captionFor(listing: CinemaListing, region: string | null): string {
  const place = region ? new Intl.DisplayNames(['en'], { type: 'region' }).of(region) : null

  /*
    `timeZone: 'UTC'` because TMDB sends a plain `YYYY-MM-DD`, which parses as
    UTC midnight. Formatted in a negative-offset zone it would render as the
    previous day — invisible on Vercel, which runs UTC, and wrong anywhere else.
  */
  const until = listing.through
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(new Date(listing.through))
    : null

  const qualifiers: string[] = []
  if (place) qualifiers.push(place)
  if (until) qualifiers.push(`to ${until}`)

  const base = 'In cinemas and coming soon'
  return qualifiers.length > 0 ? `${base} — ${qualifiers.join(', ')}` : base
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
  const region = await viewerRegion()

  let listing: CinemaListing = { films: [], through: null }
  try {
    listing = await inCinemas(region)
  } catch (cause) {
    console.error('Home: TMDB listings unavailable', cause)
  }

  /*
    The caption renders even when the listing failed. It is the page's heading
    before it is a description of the wall, and a screen with no heading is the
    fault this was half built to fix — see the accessibility contract in
    docs/spec-sheet.md.
  */
  return (
    <>
      <h1 className="micro text-muted mb-4">{captionFor(listing, region)}</h1>
      <PosterWall films={listing.films} />
    </>
  )
}
