'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import type { FilmSearchResult } from '@/lib/domain'
import { prefetchFilm } from '@/lib/film-request'
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
/**
 * How far below the last poster the wall starts asking for the next twenty.
 *
 * Roughly two rows of artwork at every width, which is the point: the request
 * goes while there is still something to look at, so the next page has landed by
 * the time the scroll reaches where it will go. At `0px` the wall would stop
 * dead at the foot on every page and wait out a round trip in full view.
 */
const LOOKAHEAD = '800px'

export function PosterWall({
  films,
  empty = 'Nothing to show from the cinema listings just now. Search is still the way in.',
  onReachEnd,
}: {
  films: FilmSearchResult[]
  /**
   * What to say when there is nothing. The default is about the listing; search
   * passes its own, because "the cinema listings" is the wrong explanation for a
   * query that matched nothing.
   */
  empty?: string
  /**
   * Called while the foot of the wall is in view, if there is more to come.
   *
   * Optional because only search pages. The cinema listing is a fixed set — what
   * is on now and what is coming — and a calendar that kept going would be the
   * feed §2 rules out.
   *
   * **It is called repeatedly, not once.** The observer reports a state, and
   * that state persists across an append that did not fill the screen, so the
   * wall keeps asking until it does. Guarding against that is the caller's job,
   * and `loadMore` in `search-provider.tsx` does it.
   */
  onReachEnd?: () => void
}) {
  const { choose } = useCapture()

  /*
    Hooks before the empty branch, not after. An early `return` above a
    `useState` is a different number of hooks on two renders of the same
    component, which React treats as a bug in the caller and not in itself.
  */
  const sentinel = useRef<HTMLDivElement>(null)
  const [atFoot, setAtFoot] = useState(false)

  useEffect(() => {
    const el = sentinel.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setAtFoot(entry?.isIntersecting ?? false),
      { rootMargin: `${LOOKAHEAD} 0px` },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /*
    Split from the observer deliberately. Calling `onReachEnd` from inside the
    callback would fire it against whatever closure the observer was created
    with, so a stale `loadMore` would page from wherever the wall was when the
    element mounted. Reading a boolean out and reacting to it here means the
    call always uses the current one — and re-runs when `loadMore`'s identity
    changes, which is precisely when a page has landed and the next one may be
    wanted.
  */
  useEffect(() => {
    if (atFoot) onReachEnd?.()
  }, [atFoot, onReachEnd])

  if (films.length === 0) {
    return <p className="text-muted max-w-sm py-10 text-sm">{empty}</p>
  }

  return (
    <>
    {/*
      ─────────────────────────────────────────────────────────────────────────
       The columns are a property of the grid, not of the window — 18 August
      ─────────────────────────────────────────────────────────────────────────

      **They were `rail:grid-cols-5 xl:grid-cols-6`, which asks the viewport a
      question only this box can answer.** It worked while the wall was the only
      thing on the page and its width could be inferred from the window's. The
      film panel breaks that inference: at 90rem the window is unchanged and this
      grid is 26rem instead of 45rem, and six columns in 26rem is a poster the
      size of a stamp.

      A container query asks the box. One rule now covers a phone, a rail, a desk
      and a desk with a panel open, with nothing to keep in step.

      ─────────────────────────────────────────────────────────────────────────
       Two steps, not four — directed 20 August
      ─────────────────────────────────────────────────────────────────────────

      **The 5- and 6-column steps are gone: above the phone the wall is four
      columns at every width, and what a wider window buys is a bigger poster
      rather than more of them.** Asked for as *four instead of five*, and the six
      went with it for a reason worth stating — the panel's column is reserved on
      the wall's route now, so a desk grid is 448px and lands on four whatever the
      window does. Leaving six above it would have made the count jump 4 → 6 as a
      window narrowed past `pane`, which is the reflow this whole change removes.

      So the ladder is three, four, five, and **five is the widest the wall ever
      gets rather than a width someone picked.**

      ⚠ **`45.5rem` is a subtraction, not a number: it is the widest this grid
      can ever be.** `main` is capped at `rail:max-w-3xl` — 48rem — and `gutter`
      spends 2.5rem of it on two sides, so 45.5rem is the whole of what is left
      when nothing else is being paid for. **The fifth column appears exactly at
      that maximum**, which above `pane` means the panel has been closed and its
      27rem handed back. Asked for on 20 August.

      ⚠ **The band's 72rem is NOT the number here, and assuming it was cost a
      measurement.** `72 − 17 − 2.5` = 52.5rem of room, but `main` never uses it:
      above `rail` it caps at 48 and the rest is margin. The grid measured 728px
      where that arithmetic predicted 840.

      ⚠ **It cannot be told from the panel's state and must not be.** A container
      query sees a box: 408px with the panel open, 728px with it closed. **A
      window of about 1040–1152 with no panel at all is also 728px** — the same
      box, so the same wall, and a rule that made those two differ would be
      reading something the grid cannot see. The count follows the room, which is
      the only thing that was ever true here.

      **The remaining threshold is the measured one** — below 26rem of grid, four
      columns are narrower than the phone already shows, which is the fault the
      old rule had at `rail` and the reason that step exists at all.
    */}
    <div className="@container">
    <ul className="@min-[26rem]:grid-cols-4 @min-[45.5rem]:grid-cols-5 grid grid-cols-3 gap-2.5">
      {films.map((film, i) => {
        const src = posterUrl(film.posterPath, 'w342')
        if (!src) return null

        return (
          <li key={film.externalId}>
            <button
              type="button"
              onClick={() => choose(film)}
              /*
                ⚠ **The round trip starts here, one press before the screen that
                needs it.** Reported 17 August: the film screen arrives in two
                stages, because the title and artwork come off this poster and
                everything else comes from `/api/film/[id]`. `pointerdown` is the
                first moment the app knows *which* film — anything earlier is
                guessing, and guessing across a six-column wall spends the
                upstream quota on the ones nobody opens. See
                `lib/film-request.ts`; the screen claims it on mount and starts
                its own if there is nothing to claim.
              */
              onPointerDown={() => prefetchFilm(film.externalId)}
              // The button is the only place the title appears. Phrased as the
              // action rather than the name, because that is what activating it
              // does — "Aftersun" alone would announce a link to a page that
              // does not exist.
              //
              // ⚠ **"Open", not "Add", since 17 August.** This used to add the
              // film in two taps through the intent sheet; it opens the film
              // screen now, and the add is a control in there. A label naming an
              // action the control no longer performs is worse than a bare title,
              // because it is confidently wrong rather than merely thin.
              aria-label={`Open ${film.title}${film.year ? `, ${film.year}` : ''}`}
              /* `rounded-artwork`, not `rounded`: the two banners that pass over
                 this wall round their lower corners by the same token, and a
                 shared corner is a relationship rather than a value they each
                 happen to hold. See `--radius-artwork` in globals.css. */
              className="focus-visible:outline-text rounded-artwork block w-full overflow-hidden transition-opacity hover:opacity-80"
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
    </div>

    {/*
      The tripwire, and nothing else.

      No spinner and no "loading more". The wall is silent artwork, and a
      caption appearing under it every twenty posters would be the loudest
      thing on the screen — announcing a mechanism whose entire job is to not
      be noticed. Posters simply continue.

      Zero height, so it adds nothing to the layout it sits at the foot of.
      `aria-hidden` because there is nothing here to read: it is a scroll
      position, not content.
    */}
    <div ref={sentinel} aria-hidden className="h-0 w-full" />
    </>
  )
}
