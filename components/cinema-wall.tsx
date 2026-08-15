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
 * document between the two grids, so *Coming soon* existed on the page whether
 * or not you had reached it, and scrolling past it read as passing a divider
 * rather than as one label changing its mind.
 *
 * **One slot, one label.** The caption sticks for the whole scroll and swaps its
 * text at the seam; there is nothing between the grids except the row gap.
 *
 * **An observer rather than a scroll listener.** The seam is a ten-pixel element
 * and `IntersectionObserver` reports it crossing the caption's own lower edge, so
 * nothing runs per frame and nothing measures `scrollY`.
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

    /*
      The caption's full box height, which — because it pins at `top: 0` — is
      exactly where its lower edge sits once pinned. Pulling the root's top edge
      down by it is what makes the swap happen when the seam reaches *the label*
      rather than when it reaches the top of the screen.
    */
    const edge = Math.round(line.getBoundingClientRect().height)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        /*
          ⚠ **Compared against the root's edge, not against zero, and getting
          that wrong is why this did nothing at all when it first shipped.**

          `boundingClientRect` is viewport-relative while `rootMargin` moves the
          root's edge down to `edge`, so the callback fires as the seam crosses
          `edge` — at which moment `top` is still a positive number about equal
          to it. Testing `top < 0` was therefore false at the only moment the
          test was ever run, and no further callback comes: an observer reports
          crossings, not positions, so the label sat on *In cinemas* for the
          whole wall.

          `rootBounds` already carries the margin, so it is the honest source
          for that line; `edge` stands in on the browsers that leave it null.
        */
        const line = entry.rootBounds?.top ?? edge
        setPast(!entry.isIntersecting && entry.boundingClientRect.top <= line)
      },
      { rootMargin: `-${edge}px 0px 0px 0px` },
    )

    observer.observe(mark)
    return () => observer.disconnect()
  }, [])

  /*
    A listing with nothing released opens on *Coming soon* rather than lying for
    the length of one screen. There is no seam to observe in that case either, so
    the state above never moves and this is the whole of it.
  */
  const live = !past && nowShowing.length > 0
  const label = live ? 'In cinemas' : 'Coming soon'

  /*
    A tick at the crossing, where the platform has one to give.

    ⚠ **iOS has none, and that is the device this is installed on.** There is no
    Vibration API in Safari, in a tab or standalone, so this is inert on the
    handset and works on Android. It is written as a capability check rather
    than a platform check for the reason `CLAUDE.md` gives — a branch that
    sniffs for a browser still executes on all of them — and `?.` is the whole
    of the check: where the method is absent nothing runs, and where it arrives
    later nothing needs changing.

    ⚠ **Chromium also requires sticky user activation**, so it stays silent
    until the page has been touched at least once. A scroll may not qualify on
    its own, which means the first crossing of a session can be quiet even on
    Android.

    12ms is a tick rather than a buzz. The crossing is a change of label, not an
    alert.

    The first run is skipped: the effect fires on mount, and a haptic on arriving
    at a screen would be announcing the screen rather than the crossing.
  */
  const settled = useRef(false)
  useEffect(() => {
    if (!settled.current) {
      settled.current = true
      return
    }
    navigator.vibrate?.(12)
  }, [past])

  return (
    <div>
      {/*
        ⚠ **`top-0` with the inset as padding, and a negative margin cancelling
        it in flow.** Three requirements meet on this one element and only this
        spelling satisfies all three.

        Pinned at the inset instead, the bar floats with a strip of screen above
        it that posters scroll through — reported, and the reason this changed.
        Pinned at zero with no padding, the label sits under the clock — also
        reported, an hour earlier. So the box has to start at the very top and
        carry the inset as padding, exactly as the masthead does.

        That would then cost the inset again as dead space *in flow*, where the
        bar sits below a masthead that has already cleared it — about 47px of
        nothing on a notched phone before the first poster. The negative margin
        is that height given back: the box is pulled up behind the masthead,
        which is opaque and one layer above, so the space it occupies is space
        the masthead was already covering. On a screen with no inset both values
        are zero and this reads exactly as it always did.

        ⚠ **It sits below the masthead on purpose**, `z-10` against its `z-20`,
        which `main`'s `isolate` makes a guarantee rather than a coincidence of
        two numbers in different stacking contexts. So the label is hidden while
        the masthead is up and appears as the masthead recedes — present exactly
        while you are scrolling down through posters, and handing the top strip
        back to the mark when you scroll up.

        **Glass rather than a ground.** Directed. `bg-bg/60` with a backdrop blur
        rather than the flat `bg-bg` this had, so the artwork passing underneath
        stays legible as movement without the letters sitting on top of it. It is
        the first translucent surface in the app and the only one; §11's matte
        black is otherwise unbroken, and a second one would make this a theme
        rather than a bar.
      */}
      {/*
        **An arbitrary property overriding the tier's own token, rather than a
        second size class.** `micro` reads that variable for its font size, so
        setting it on this element scales this one caption without touching the
        tier everywhere else, and without two size declarations racing to win on
        emission order — the trap the note on `input-text` describes. 13px
        against the tier's 11: this is a standfirst now rather than metadata
        beside a title.

        ⚠ **Do not write the class's own syntax into a comment.** Tailwind scans
        this file as text and does not know what a comment is, so an example
        spelled out in prose is compiled into a real rule — one appeared in the
        stylesheet with a literal ellipsis for a value, from the sentence that
        used to be here.
      */}
      <h2
        ref={caption}
        className={`micro bg-bg/60 sticky top-0 z-10 mt-[calc(-1_*_env(safe-area-inset-top))] [--text-micro:0.8125rem] pt-[calc(env(safe-area-inset-top)_+_0.75rem)] pb-3 backdrop-blur-xl ${
          /*
            Recording red for the half that is on now — see `--color-live`, which
            carries the argument for a second red and the scarcity rule that
            keeps it meaning something. *Coming soon* stays muted: the point of
            the colour is the distinction, and colouring both would erase it.

            Nothing depends on seeing it. The two words carry the whole of the
            meaning on their own.
          */
          live ? 'text-live' : 'text-muted'
        }`}
      >
        {/*
          **Keyed by the word, which is what replays the blink.** A CSS animation
          runs when an element is inserted, not when its text changes, so without
          a changing key the caption would swap silently after the first time.
          Remounting one span is the cheapest way to say "this is new" and needs
          no animation state of its own.

          It also blinks on first mount, which costs nothing: at rest the
          masthead is up and this is behind it, so the only blink anybody sees is
          one that follows a crossing.
        */}
        <span key={label} className="animate-caption">
          {label}
        </span>
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
