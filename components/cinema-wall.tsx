'use client'

import { useEffect, useRef, useState } from 'react'

import type { FilmSearchResult } from '@/lib/domain'
import { PosterWall } from './poster-wall'

/**
 * The home wall in two halves under **one** caption, which changes from
 * *In cinemas* to *Coming soon* as the first unreleased row arrives.
 *
 * ⚠ **There were two sticky headings here for about an hour on 15 August**, one
 * per section, each pinning and being pushed out by the next — list-section
 * behaviour, and pure CSS. It was rejected on sight for the reason that is
 * obvious once seen: the second heading is a permanent band sitting in the
 * document between the two grids, so *Coming soon* exists on the page whether or
 * not you have reached it, and scrolling past it reads as passing a divider
 * rather than as one label changing its mind.
 *
 * **One slot, one label.** The caption sticks for the whole scroll and swaps its
 * text at the seam; there is nothing between the grids except the row gap.
 *
 * **An observer rather than a scroll listener.** The seam is a 1px element and
 * `IntersectionObserver` reports it crossing the caption's own lower edge, so
 * nothing runs per frame and nothing measures `scrollY`. The root's top edge is
 * pulled down by the caption's measured height, which is what makes the swap
 * happen when the seam reaches the label rather than when it reaches the top of
 * the screen.
 *
 * Both directions come from one reading. `isIntersecting` goes false at the top
 * *and* at the bottom of the root, so the sign of `boundingClientRect.top` is
 * what tells those apart — above the line is *Coming soon*, below is still
 * *In cinemas*, and scrolling back up restores it without a second observer.
 */
export function CinemaWall({
  nowShowing,
  comingSoon,
}: {
  nowShowing: FilmSearchResult[]
  comingSoon: FilmSearchResult[]
}) {
  const caption = useRef<HTMLHeadingElement>(null)
  const seam = useRef<HTMLDivElement>(null)

  const [past, setPast] = useState(false)

  useEffect(() => {
    const mark = seam.current
    const line = caption.current
    if (!mark || !line) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { rootMargin: `-${Math.round(line.getBoundingClientRect().height)}px 0px 0px 0px` },
    )

    observer.observe(mark)
    return () => observer.disconnect()
  }, [])

  /*
    A listing with nothing released opens on *Coming soon* rather than lying for
    the length of one screen. There is no seam to observe in that case either, so
    the state below never moves and this is the whole of it.
  */
  const label = past || nowShowing.length === 0 ? 'Coming soon' : 'In cinemas'

  return (
    <div>
      {/*
        ⚠ **`top` is the safe-area inset, not zero.** Pinned at zero the label
        sits under the status bar and the clock is drawn over it — reported on
        the handset within minutes of shipping, and the exact fault
        `env(safe-area-inset-top)` exists for. The masthead has always cleared
        this; a second pinned surface needed telling separately.

        ⚠ **It sits below the masthead on purpose**, `z-10` against its `z-20`,
        which `main`'s `isolate` makes a guarantee rather than a coincidence of
        two numbers in different stacking contexts. So the label is hidden while
        the masthead is up and appears as the masthead recedes — present exactly
        while you are scrolling down through posters, and handing the top strip
        back to the mark when you scroll up.

        `bg-bg` because a pinned label with no ground has posters sliding
        through the letters.
      */}
      <h2
        ref={caption}
        className="micro text-muted bg-bg sticky top-[env(safe-area-inset-top)] z-10 py-3"
      >
        {label}
      </h2>

      {nowShowing.length > 0 && <PosterWall films={nowShowing} />}

      {/*
        The seam: the thing the observer watches, and the gap between the two
        grids in one element. `h-2.5` is `gap-2.5` from the wall, so the rhythm
        of the rows carries across the join and the two grids read as one wall
        with a change of subject rather than as two lists.
      */}
      {nowShowing.length > 0 && comingSoon.length > 0 && (
        <div ref={seam} aria-hidden className="h-2.5" />
      )}

      {comingSoon.length > 0 && <PosterWall films={comingSoon} />}
    </div>
  )
}
