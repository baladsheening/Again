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
 * **An observer rather than a scroll listener**, and it watches a *half* rather
 * than the boundary between them — see the note on the effect, which is a bug
 * report and the reason.
 */
export function CinemaWall({
  nowShowing,
  comingSoon,
}: {
  nowShowing: FilmSearchResult[]
  comingSoon: FilmSearchResult[]
}) {
  const caption = useRef<HTMLHeadingElement>(null)
  const showing = useRef<HTMLDivElement>(null)

  const [past, setPast] = useState(false)

  /*
    There is only a crossing to watch when there are two halves to cross
    between. **The seam used to carry this by not existing** — with one half
    there was no element to observe and the effect fell out at its first line.
    The subject is a grid now, and a grid is there either way, so the condition
    is stated rather than implied: without it, reaching the foot of a listing
    with nothing coming would announce *Coming soon* over an empty page.
  */
  const bothHalves = nowShowing.length > 0 && comingSoon.length > 0

  useEffect(() => {
    const half = showing.current
    const line = caption.current
    if (!bothHalves || !half || !line) return

    /*
      The caption's full box height, which — because it pins at `top: 0` — is
      exactly where its lower edge sits once pinned. Pulling the root's top edge
      down by it is what makes the swap happen when the wall reaches *the label*
      rather than when it reaches the top of the screen.
    */
    const edge = Math.round(line.getBoundingClientRect().height)

    /*
      ─────────────────────────────────────────────────────────────────────────
       It watches a half, because a boundary cannot report a jump — 16 August
      ─────────────────────────────────────────────────────────────────────────

      ⚠ **Reported from the handset**: in *Coming soon*, tapping the status bar
      to fly to the top left the caption reading *Coming soon* over the first
      row of what is on now, and only scrolling back down through the crossing
      would put it right.

      **This observed the ten-pixel seam, and an observer reports changes.** The
      seam's two states are the same state to it — out of view above and out of
      view below are both `isIntersecting: false` — so going from one to the
      other without stopping in between is not a change and raises no callback.
      An instant scroll to the top is exactly that, and a hard enough flick can
      be too, since intersections are computed per rendering opportunity and a
      fast scroll can put the seam on both sides of the line in consecutive
      frames. The label was never stale; it was never told.

      **So the subject is a half rather than the boundary.** *In cinemas* is
      precisely "some of what is on now is still below the caption", and that is
      a state an observer can hold rather than an event it can miss: the two
      answers differ in `isIntersecting`, so every crossing between them raises
      a callback whatever route it takes, at any speed, including none.

      That deletes the comparison this used to make against `rootBounds.top` —
      the position test that was needed because the boolean could not tell above
      from below. Nothing here asks where anything is any more.

      The swap point does not move: the grid's bottom edge *is* the seam's top
      edge, so "the grid has left the band" and "the seam has entered it" name
      the same pixel.

      **Both mechanisms were run on one page in a browser before this changed.**
      Walked down a step at a time they agree, swapping at the same scroll
      position. Jumped from deep in *Coming soon* to the top, the seam holds
      *Coming soon* and does not recover on any later jump; the half reads *In
      cinemas*. And from a fresh load, jumping straight down leaves the seam on
      *In cinemas* — the same defect the other way round, which nobody had hit
      because nothing jumps down a page by itself.

      ⚠ **Still an observer rather than a scroll listener, and now for a better
      reason than cheapness.** iOS withholds events during momentum — this shell
      has been bitten by that once already, see the note where
      `USER_SCROLL_GRACE_MS` used to be in `components/shell.tsx` — while
      intersections are recomputed from layout on every rendering opportunity,
      delivered events or not. A scroll listener would answer the jump correctly
      and reopen that.
    */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setPast(!entry.isIntersecting)
      },
      { rootMargin: `-${edge}px 0px 0px 0px` },
    )

    observer.observe(half)
    return () => observer.disconnect()
  }, [bothHalves])

  /*
    A listing with nothing released opens on *Coming soon* rather than lying for
    the length of one screen. `bothHalves` is false in that case, so nothing is
    observed, `past` never moves, and this line is the whole of it.
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
        ⚠ **`top-0` with the inset as padding, and a negative margin putting the
        whole box behind the mark.** Three requirements meet on this one element
        and only this spelling satisfies all three.

        Pinned at the inset instead, the bar floats with a strip of screen above
        it that posters scroll through — reported, and the reason this changed.
        Pinned at zero with no padding, the label sits under the clock — also
        reported, an hour earlier. So the box has to start at the very top and
        carry the inset as padding, which is what `masthead-box` is: **the
        masthead's own paddings, worn rather than matched.**

        ─────────────────────────────────────────────────────────────────────
         The margin is the whole masthead now, not the notch — 16 August
        ─────────────────────────────────────────────────────────────────────

        ⚠ **The two notes below claimed the label was hidden at rest, and it was
        not.** It cancelled `env(safe-area-inset-top)` only, which left the box
        sitting in flow *below* a masthead that had already cleared it — so the
        label hung under the mark on the opening screen, and `sticky` had
        nothing to pin until you had scrolled past it. Asked for on 16 August:
        the caption should appear when the mark goes, and not before.

        `--masthead-clearance` is that distance — the mark's box and its hem, the
        same quantity `main` pads its top by. Pulling the box up by exactly it
        lands this band **on** the masthead's painted band: same top edge, same
        bottom edge, one banner that changes what it says. The wall is untouched
        by the move, because the margin cancels the height the box would
        otherwise cost in flow.

        ⚠ **Sitting under the mark is no longer what hides it, and that is the
        second half of the same report.** A pull-down at the top rubber-bands the
        document while the `fixed` header stays with the viewport, so the label
        slid out from under it and was visible on the opening screen. Covering is
        not hiding: it holds only while the two move together, and overscroll is
        the case where the platform moves them apart. So the caption reads the
        mark's own state — `data-masthead` on `#scroll-root`, see the note there
        — and is painted only while the mark is away. Nothing the scroller does
        can put it on screen beside the mark now, because it is not a question
        about position any more.

        The fade is the masthead's own 300ms, so the two are one movement: the
        mark slides off while the label comes up behind it, and back the other
        way. Instant would blink the label out at the start of the return, three
        hundred milliseconds before the mark had covered the space it left.

        **The wall comes up by the height of the caption**, which is the visible
        half of the change: the posters now begin at `main`'s padding, where
        content begins on every other screen, instead of a caption's height
        below it.

        **Above `rail` the pull is the notch again**, because there is no
        masthead up there to hide behind and nothing to be revealed from under.
        The caption is an ordinary sticky heading at the top of the column there,
        exactly as before.

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
      {/*
        ─────────────────────────────────────────────────────────────────────
         Pinned, this is the masthead — 16 August
        ─────────────────────────────────────────────────────────────────────

        **Where the label settles is where the mark stands.** Scrolling down
        slides the masthead off the top of the screen and pins this in the strip
        it vacates, so the two are one slot occupied at two different moments.
        Anything that placed them separately would show as the top-left corner
        of the app stepping sideways or up on a scroll — a movement with no
        cause a person could name, which is the worst kind.

        So the placement is not matched, it is **shared**, in all three terms:

        - `masthead-box` — the air above and below, notch included. One
          declaration in globals.css, worn by the header and by this.
        - `h-[var(--wordmark-ink)]` on the row, contents centred, exactly as the
          header's row does it. The mark is trimmed to fill that height, so
          centring a 13px line in the same box puts these letters through the
          middle of where that word was.
        - `--type-indent`, the same fraction in from the gutter the mark carries.

        None of the three is a number written here, so a change of type size,
        face or gap moves both surfaces together or neither.

        **Measured rather than reasoned**, at 390px with both real faces: the two
        bands are 45.75px, the row is 25.75, and the caption's capitals centre
        0.33px above the mark's ink — which is also, at this size, the centre of
        its lowercase mass. Its baseline sits 2.83px higher than the mark's,
        because the rule here is *centred in the row*, which is the rule the
        header already applies to everything in that row except the mark itself.

        ⚠ **The letters start 1px apart and that is left alone.** Both text
        origins land at 26px; Ojuju's `A` carries a side bearing at 28px that
        13px capitals do not, so the mark's ink begins at 27 and the caption's at
        26. Correcting it would mean a per-face, per-*glyph* nudge — and the
        caption has two words, so there is no one glyph to correct against. The
        stable thing to align is where the text is set from, which is what
        `--type-indent` does.

        **The indent is padding rather than a margin, and the row is inside the
        glass**: the band still spans the column and blurs the artwork passing
        under it. The indent says where the *letters* start, not where the bar
        does.

        The band is therefore exactly as tall as the masthead — which is also
        what keeps it hidden until it is wanted, since the header is opaque, one
        layer above, and paints a further `0.5rem` of ground below itself.
      */}
      <h2
        ref={caption}
        className={`micro bg-bg/60 masthead-box group-data-[masthead=gone]/masthead:opacity-100 rail:mt-[calc(-1_*_env(safe-area-inset-top))] rail:opacity-100 sticky top-0 z-10 mt-[calc(-1_*_var(--masthead-clearance))] opacity-0 transition-opacity duration-300 [--text-micro:0.8125rem] pl-[var(--type-indent)] backdrop-blur-xl ${
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
          The row, and it is the masthead's row: the same height, centred the
          same way. It is a wrapper rather than classes on the label itself
          because the label remounts on every crossing — see below — and a box
          that has to hold still is not a thing to rebuild.

          ⚠ **`mb-[var(--masthead-hem)]` is the hem, and it is a margin here
          because the masthead's is a shadow.** Asked on 16 August why the mark's
          banner runs deeper than this one: it does, by exactly this, because the
          header paints `--masthead-hem` of ground below itself to stop posters
          showing through the gap it keeps from the wall. Deleting that gap is
          the thing not to do — the note on the token says why — so the band that
          had no hem grows one instead, and the two banners now paint to the same
          line.

          On the row rather than as a second `padding-bottom` on the `h2`:
          `masthead-box` already sets that property, and two rules writing one
          property leaves the answer to emission order. A margin inside the box
          adds the same height and cannot race anything.

          ⚠ **Less the descender, which is what makes it look in line rather than
          merely level — 16 August.** Reported: on the same line as the mark, and
          optically low against it.

          It was centred honestly and that was the fault. `--wordmark-ink` is
          cap-to-tail, so its centre is not the centre anyone sees — a reader
          takes a word between its cap line and its baseline and discounts the
          `g`'s tail, which is a stroke rather than mass. The two centres are
          half a descender apart, and the caption was sitting on the lower one.

          `pb-[var(--wordmark-drop)]` takes the tail off the bottom of the row,
          so what is centred in is exactly the band the eye reads. **A
          subtraction, not a nudge**: no lift is written here, nothing is tuned
          to a screenshot, and a change of size or face moves it through the same
          two tokens that move everything else about the mark.

          It lifts the label in both states at once, which is the other half of
          what was asked. The padding is inside a box whose height has not
          changed, so the glass band is still exactly the masthead's and the
          posters have not moved — at rest the words rise off the wall by the
          same amount they rise when pinned.
        */}
        <span className="mb-[var(--masthead-hem)] flex h-[var(--wordmark-ink)] items-center pb-[var(--wordmark-drop)]">
          {/*
            **Keyed by the word, which is what replays the blink.** A CSS
            animation runs when an element is inserted, not when its text
            changes, so without a changing key the caption would swap silently
            after the first time. Remounting one span is the cheapest way to say
            "this is new" and needs no animation state of its own.

            It also blinks on first mount, which costs nothing: at rest the
            masthead is up and this is behind it, so the only blink anybody sees
            is one that follows a crossing.
          */}
          <span key={label} className="animate-caption">
            {label}
          </span>
        </span>
      </h2>

      {/*
        **The half, boxed, because the half is what the observer watches.** A
        plain block around a grid that is already a block, so it adds no layout
        and its lower edge is the grid's own — see the effect for why the state
        is a region rather than the line at the end of it.
      */}
      {nowShowing.length > 0 && (
        <div ref={showing}>
          <PosterWall films={nowShowing} />
        </div>
      )}

      {/*
        The seam, and it is now only the gap between the two grids — the
        observer stopped watching it on 16 August. `h-2.5` is `gap-2.5` from the
        wall, so the rhythm of the rows carries across the join and the two
        grids read as one wall with a change of subject rather than as two
        lists.
      */}
      {bothHalves && <div aria-hidden className="h-2.5" />}

      {comingSoon.length > 0 && <PosterWall films={comingSoon} />}
    </div>
  )
}
