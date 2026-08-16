'use client'

import { useEffect, useRef, useState } from 'react'

import type { FilmSearchResult } from '@/lib/domain'
import { PosterWall } from './poster-wall'

/**
 * The home wall in two halves under **one** caption, which changes from
 * *In cinemas* to *Coming soon* as the first unreleased row arrives.
 *
 * ⚠ **The caption is switched off — see `CAPTION` below, which is why and what
 * turns it on.** Everything this comment describes is built, measured and
 * unrendered; the two halves ship without it. Read that note before changing
 * anything here, because the reason is a product decision rather than a fault.
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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The caption is switched off, and this line is what brings it back
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **D1 was answered `no` on 16 August: Again does not become cinema-aware now**
 * — the gate is named in *Pre-phase 2* in `docs/plan.md` and the decision is
 * written up in `docs/decisions.md`. TMDB holds release dates and no cinema
 * programming at all, so *In cinemas* was a sentence its data could not support.
 * There were two honest moves — pay for showtimes, or stop saying it — and this
 * is the second.
 *
 * **The wall is unlabelled again and makes no checkable claim**, which is what
 * it was until 14 August. A prompt cannot be wrong; a statement about the world
 * can.
 *
 * ⚠ **Nothing below is deleted, and that is structural rather than
 * sentimental.** Showtimes are coming back as a paid feature, and when they do
 * this band is the surface they are said on: the label, the glass, the blink,
 * the two halves and the placement shared with the mark are the shape that data
 * arrives in. Every number in here was measured against a real face on a real
 * screen, and deleting it means measuring all of them again.
 *
 * **So it stays as live code rather than as a comment.** It is type-checked on
 * every build, linted with everything else, and its classes are still emitted by
 * Tailwind — which is the whole difference between a feature waiting and a
 * comment rotting. Commented-out JSX compiles nothing, drifts with the code
 * around it, and fails on the day somebody uncomments it.
 *
 * ⚠ **The `: boolean` is load-bearing.** Annotated, both branches stay live to
 * the compiler. As a bare `false` the checker treats everything behind it as
 * unreachable, which is the rot this spelling exists to avoid.
 *
 * **Flipping it is the whole restoration.** Back with it come the glass band,
 * the word that changes at the seam, the blink, the haptic and the observer.
 * Not conditional on it: the two halves, which stay ordered as they are — see
 * `inCinemas` in `lib/tmdb.ts`, which still returns both.
 */
const CAPTION: boolean = false

/**
 * The band appearing as the mark goes, worn by **each layer of it** rather than
 * by the box that holds them.
 *
 * ⚠ **That is not a style choice: an element at less than full opacity forms a
 * backdrop root, and a backdrop root leaves a descendant's `backdrop-filter`
 * nothing to sample.** Measured in a browser against a hard edge — with the
 * parent at `opacity: 0.5` the child's blur came out at 0.8px of softening,
 * which is none; the same blur on the element that carries the opacity measured
 * 40.5, which is the 62.5 of a full-strength blur seen through half an alpha.
 * Put the fade on the `h2` and the glass would arrive un-blurred and snap into
 * focus at the end of every reveal.
 *
 * So the three layers fade together and separately. `--masthead-hem`, the row
 * height and the indent still come from tokens; only this repeats, and it
 * repeats as one string rather than as three that could drift.
 *
 * `rail:opacity-100` because above the breakpoint there is no mark to be absent
 * — see `data-masthead` in `components/shell.tsx`.
 */
const REVEAL =
  'opacity-0 transition-opacity duration-300 group-data-[masthead=gone]/masthead:opacity-100 rail:opacity-100'

/**
 * The same reveal for the word, **without the cross-fade**.
 *
 * ⚠ **Reported 16 August: flying to the top from *Coming soon* shows a glimpse
 * of a red *In cinemas* on the way.** That is the glass fading out over 300ms
 * while the observer, watching the wall come back up, flips the word underneath
 * it. A jump to the top is transit — nobody reads a caption during it, and the
 * place it lands has no caption at all — so what was on screen was a label
 * announcing itself on its way out.
 *
 * The glass keeps its fade, because a band that vanishes on the frame the mark
 * starts sliding back leaves the top strip bare for three hundred milliseconds.
 * The word does not need one: **its entrance is the blink**, and its exit should
 * be the moment it stops being true. So it appears and vanishes outright, and
 * the glass dissolves around it.
 */
const WORD = 'opacity-0 group-data-[masthead=gone]/masthead:opacity-100 rail:opacity-100'
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
    /* `CAPTION` off means there is no label to keep true, so nothing is watched. */
    if (!CAPTION || !bothHalves || !half || !line) return

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
    /* Nothing crosses while the label is off, and a tick would mark nothing. */
    if (!CAPTION) return
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

        **Glass rather than a ground.** Directed. `bg-bg/60` over a backdrop blur
        rather than the flat `bg-bg` this had, so the artwork passing underneath
        stays legible as movement without the letters sitting on top of it. It is
        the first translucent surface in the app and the only one; §11's matte
        black is otherwise unbroken, and a second one would make this a theme
        rather than a bar.

        ⚠ **The glass is not on this element any more — it is two layers inside
        it**, because the blur ramps up the band and an element cannot hold two
        strengths of it. See the note on the layers below; the short version is
        that anything carrying a `backdrop-filter` becomes a backdrop root and
        would leave its own children nothing to blur.

        ⚠ **This band had the posters' corner on its feet for one commit, and it
        is square again — directed, 16 August.** It was `rounded-b-artwork`, with
        `overflow-hidden` carrying the curve down to both glass layers; both are
        gone, and the second went with the first because with nothing to round it
        was clipping a pair of layers that already fit the box exactly.

        The mark's banner still carries the corner. It has never read there — the
        header runs to the screen's edges, where there is only ground behind it —
        so the pair look the same either way, which is why removing one is not a
        pair that has drifted. `--radius-artwork` stays: the wall is what it is
        named for, and the posters are still cut with it.
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
      {CAPTION && (
        <h2
          ref={caption}
          className={`micro masthead-box rail:mt-[calc(-1_*_env(safe-area-inset-top))] sticky top-0 z-10 mt-[calc(-1_*_var(--masthead-clearance))] [--text-micro:0.8125rem] pl-[var(--type-indent)] ${
            /*
              Recording red for the half that is on now — see `--color-live`, which
              carries the argument for a second red and the scarcity rule that
              keeps it meaning something. *Coming soon* stays uncoloured: the point
              of the red is the distinction, and colouring both would erase it.

              Nothing depends on seeing it. The two words carry the whole of the
              meaning on their own.

              ⚠ **`text-text/80`, not `text-muted` — 16 August, directed: less
              muted.** `--color-muted` is `--color-text` at 60%, and it is tuned
              for text on ground. This text is on glass over artwork that is
              moving, so 40% of every letterform was the wall: measured at the
              caption's row, 6.07:1 over a dark poster, 5.61 over a middling one
              and **4.49 over a bright one** — the last of those is the 4.5:1 floor
              for text this size, which makes it the one marginal thing in the
              band rather than merely a quiet one. At 80% it reads 10.43 / 8.91 /
              6.63 and half as much wall comes through the letters.

              **It is deliberately still brighter than the red**, which measures
              5.79:1 here — as the muted value already was. The red does not carry
              by being lighter; it carries by being the only colour on the screen
              and by naming the half that is on.
            */
            live ? 'text-live' : 'text-text/80'
          }`}
        >
          {/*
            ─────────────────────────────────────────────────────────────────────
             The glass is two layers, and the blur ramps up it — 16 August
            ─────────────────────────────────────────────────────────────────────

            Directed: the band's blur should double from its foot to its head,
            linearly. **`backdrop-filter` cannot be graded** — it is one strength
            over the whole element — so the ramp is two blurs stacked, the upper
            one masked to fade in toward the top.

            ⚠ **They have to be siblings, and that took measuring.** An element
            with a `backdrop-filter` *is a backdrop root*, so a child of it has no
            page left to blur: nested, the second layer changed a hard edge's
            softening by 0.0px. Which is why the `h2` above gives up the blur it
            used to carry — it would have made itself the root of its own layers.

            ⚠ **Blurs compose in quadrature, so the upper layer is not the target.**
            To land on `2b` over a base of `b` it must be `b√3` — 41.57 against 24,
            not 48. Measured on a hard edge, in edge widths where a flat `blur(24)`
            reads 62.5 and a flat `blur(48)` reads 124.0: the two stacked at 24 and
            41.57 read **125.0**, and a top layer of 48 overshoots to 134.

            Masked with a plain linear alpha, the ramp measured 121 · 107 · 91 ·
            76.8 · **65.5** down the band — 48 at the head, 24 at the foot, and
            near enough a straight line between them. The mask is alpha rather than
            luminance, which is what `to top, transparent, black` gives.

            ─────────────────────────────────────────────────────────────────────
             The ground is a third layer, on its own curve — 16 August
            ─────────────────────────────────────────────────────────────────────

            Directed: darker at the top, and **the gradient should accentuate the
            row the caption sits in.**

            ⚠ **The ground and the blur want different shapes, so they stopped
            sharing one.** The blur is depth: it should ramp the whole way up the
            band, which is what the mask above does. The ground is emphasis: its
            job is to make the label read as a label, which means being at full
            strength *through the row* and letting go below it. Riding one mask
            forces one curve on both, and the curve that suits either is wrong for
            the other.

            So the tint left the lower blur layer — where it was flat, because the
            upper layer would have blurred any gradient it held into something
            smoothed and lighter than asked for — and became a layer of its own,
            above both blurs, where nothing filters it and it stays exactly as
            steep as it is written.

            **Its shape is a strip the page can name.** `--band-solid` is
            `env(safe-area-inset-top)`: the ground holds at full strength for
            exactly the depth of the status bar — where iOS draws the clock, the
            signal and the battery, over which it has no say — and eases away
            through everything below it, the caption's row included.

            ⚠ **Held flat through the row instead for one commit, and it was
            rejected on sight.** `--masthead-height` less a `--masthead-gap` puts
            the flat region's edge exactly where the letters end, which reads as a
            near-solid slab with a 16px lip rather than as glass. The instinct it
            fails is the right one: **a band that is flat for most of its height is
            not a gradient, it is a bar with a soft edge.** Starting the fall at
            the status bar's foot gives the ramp the whole rest of the band to
            happen in, and the row still sits high on it.

            88% at the top against 60% at the band's foot. The first is most of the
            way to the flat `bg-bg` the rest of the app is made of; the second is
            the glass this band has always been. Where there is no inset — a tab,
            Android, the desk — the flat region is zero and this is a plain linear
            fade, which is what it should be when there is no status bar to sit
            under.

            Both layers are `inset-0`, so they are the box exactly and nothing here
            needs clipping — the `overflow-hidden` that cut them to the banner's
            rounded feet went when the corners did.
          */}
          <span aria-hidden className={`${REVEAL} backdrop-blur-band absolute inset-0`} />
          <span
            aria-hidden
            className={`${REVEAL} absolute inset-0 backdrop-blur-[calc(var(--blur-band)_*_1.7320508)] [mask-image:linear-gradient(to_top,transparent,black)] [-webkit-mask-image:linear-gradient(to_top,transparent,black)]`}
          />
          <span
            aria-hidden
            className={`${REVEAL} absolute inset-0 [--band-solid:env(safe-area-inset-top)] [background-image:linear-gradient(to_bottom,color-mix(in_srgb,var(--color-bg)_88%,transparent)_var(--band-solid),color-mix(in_srgb,var(--color-bg)_60%,transparent))]`}
          />

          {/*
            **The blink, moved onto something big enough to see.** A sheet of plain
            ground that steps solid on the first frame, holds for 80ms and eases
            out — see `--animate-band`, which carries the measurement: the word is
            2.57% of this band's area, and peripheral vision reads area and rate,
            not colour or letterforms.

            It wears no `REVEAL`. Its resting state is gone at every width, and the
            animation is the only thing that ever shows it, so the state variant
            governs whether it may run rather than whether it is there.

            **Keyed like the word, and for the same reason.** The variant starts it
            when the band is revealed; the key starts it again when the word
            changes underneath an already-open band, where the state has not moved.
            Between them it fires on both, and on nothing else.

            It sits above the glass and below the label, so what it interrupts is
            the artwork rather than the word — for those 80ms the letters are on
            solid ground, which is also what covers the swap from one word to the
            other.
          */}
          <span
            key={label}
            aria-hidden
            className="bg-bg group-data-[masthead=gone]/masthead:animate-band rail:animate-band absolute inset-0 opacity-0"
          />

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
          <span
            className={`${WORD} relative mb-[var(--masthead-hem)] flex h-[var(--wordmark-ink)] items-center pb-[var(--wordmark-drop)]`}
          >
            {/*
              **It blinks when the word changes and when the band arrives, and
              those are two different mechanisms.**

              *Keyed by the word* is the first. A CSS animation runs when an
              element is inserted, not when its text changes, so without a changing
              key the caption would swap silently after the first time. Remounting
              one span is the cheapest way to say "this is new" and needs no
              animation state of its own.

              ⚠ **That alone made the two labels behave differently, which is the
              16 August report.** *Coming soon* always arrives by the word
              changing, so it always blinked. *In cinemas* is usually already
              mounted when the mark recedes — it has been sitting there behind it
              since the page loaded — so the band appeared and the word just sat
              there.

              *Applied by the state* is the second, and it is why this is a variant
              rather than a plain class. An animation starts when `animation-name`
              goes from none to a name, so hanging it on `data-masthead` starts it
              at the exact moment the band is revealed — for either word, however
              long it has been mounted. Unconditionally applied it could never do
              that: the property would already be set, and a value that does not
              change does not restart anything.

              Above `rail` the mark is not there to recede, so the animation is
              applied outright and the key is the only trigger — which is what this
              has always done at that width.
            */}
            <span
              key={label}
              className="group-data-[masthead=gone]/masthead:animate-caption rail:animate-caption"
            >
              {label}
            </span>
          </span>
        </h2>
      )}

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
