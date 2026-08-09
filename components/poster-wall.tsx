'use client'

import Image from 'next/image'

import type { FilmSearchResult } from '@/lib/domain'
import { posterUrl } from '@/lib/posters'
import { useCapture } from './capture-provider'

/**
 * The home screen: what is on, and what is about to be. Posters and nothing
 * else.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  This is the largest deviation from the brief in the project (9 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * §11 allows "no imagery beyond small poster thumbnails" and §2 rules out public
 * discovery and algorithmic recommendation. A wall of forty posters is imagery
 * beyond a thumbnail by any reading, and it was directed deliberately — see
 * docs/decisions.md for the argument, which is that this is a **capture prompt**
 * rather than a catalogue:
 *
 *  - It is not availability. §2's most-tempting-wrong-feature is "where to get
 *    it" — streaming lookup, retailer links, price tracking. Nothing here says
 *    where to watch anything, and nothing should ever be added that does.
 *  - It is not recommendation. There is no algorithm, no personalisation, no
 *    ranking by anything about you. Everyone signed in sees the same wall, and
 *    it is ordered by release date rather than by TMDB's popularity score
 *    precisely so it does not become a chart (`inCinemas` in lib/tmdb.ts).
 *  - It is not a feed. It does not accumulate, it cannot be scrolled forever,
 *    and nothing about it changes based on what you did yesterday.
 *
 * **Tapping a poster starts an add.** That is what keeps this a capture surface
 * rather than something to look at: the wall exists to be the answer to "what
 * have I been meaning to see", and an answer you cannot act on is decoration.
 *
 * No titles, by instruction. The artwork is the recognition — and the
 * accessible name on each button carries the title for anyone the artwork does
 * not reach.
 *
 * Images come straight from TMDB's CDN (§3: never proxy images through the app;
 * `images.unoptimized` in next.config.ts is what stops `next/image` doing it
 * quietly).
 */
export function PosterWall({
  films,
  empty = 'Nothing to show from the cinema listings just now. Search is still the way in.',
}: {
  films: FilmSearchResult[]
  /**
   * What to say when there is nothing. The default is about the listing; search
   * passes its own, because "the cinema listings" is the wrong explanation for a
   * query that matched nothing.
   */
  empty?: string
}) {
  const { choose } = useCapture()

  if (films.length === 0) {
    return <p className="text-muted max-w-sm py-10 text-sm">{empty}</p>
  }

  return (
    <ul className="rail:grid-cols-5 xl:grid-cols-6 grid grid-cols-3 gap-2.5">
      {films.map((film, i) => {
        const src = posterUrl(film.posterPath, 'w342')
        if (!src) return null

        return (
          <li key={film.externalId}>
            <button
              type="button"
              onClick={() => choose(film)}
              // The button is the only place the title appears. Phrased as the
              // action rather than the name, because that is what activating it
              // does — "Aftersun" alone would announce a link to a page that
              // does not exist.
              aria-label={`Add ${film.title}${film.year ? `, ${film.year}` : ''}`}
              className="focus-visible:outline-text block w-full overflow-hidden rounded transition-opacity hover:opacity-80"
            >
              <Image
                src={src}
                alt=""
                width={342}
                height={513}
                /*
                  The first row is above the fold on every screen, so it is worth
                  the priority hint; everything after it is lazy by default and
                  arrives as the wall is scrolled. Six covers three columns on a
                  phone and part of the first row at rail widths.
                */
                priority={i < 6}
                className="bg-surface aspect-[2/3] w-full object-cover"
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
