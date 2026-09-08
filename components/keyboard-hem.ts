'use client'

import { useEffect } from 'react'

/**
 * How long a software keyboard takes to arrive, and therefore how long the
 * measuring loop below stays open after a viewport event. Generous: the cost of
 * over-running is a few idle frames, the cost of under-running is the page's hem
 * arriving after the keys.
 */
const KEYBOARD_ARRIVAL_MS = 700

/**
 * Holds the foot of the *page* above an open keyboard, and the live band on the
 * top edge of what is left visible.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It used to hold the foot bar there too, and on 24 August it stopped
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **The foot bar is not wanted above the keys, and the way to not want it is
 * to stop lifting it.** It was `useKeyboardPin`, and its first job was holding
 * the bar on the keyboard's top edge — which spent a bar's worth of an already
 * shrunken screen on four glyphs that are **all off while somebody is writing**:
 * cross off and settle are `null` with nothing picked, and the camera and search
 * are not built. Picking a line blurs the live one, so the bar is never wanted
 * while a keyboard is up.
 *
 * Deleting the lift is not a workaround for the platform, it is the platform's
 * own behaviour left alone: iOS positions `fixed` against the **layout**
 * viewport, which keeps its full height while the keyboard covers the bottom of
 * it — so `bottom-0` sits behind the keys with nothing done to it. What used to
 * be the symptom is now the requirement.
 *
 * ⚠ **What went with it: `footAnchor`, the thermostat, and the foot's second
 * mover.** The `<footer>` is now moved by exactly one thing, the recede's
 * `translate`. **Do not put a transform back on it** without reading
 * `chrome-recede.ts` first — two writers on one element is what the last three
 * days of this file were about.
 *
 * ⚠ **The five wrong versions are recorded here on purpose**, because the lesson
 * outlived the code. Five versions computed a lift from viewport arithmetic and
 * every one was wrong on a real handset in a different way: the bar rode up on
 * scroll, or stuck above the keyboard, or sat behind it. Each fix was a better
 * guess at what iOS means by `innerHeight`, `clientHeight` and `offsetTop` with
 * a keyboard open, and each guess was falsified by the next test. **The guessing
 * was what was wrong, not any particular guess** — which is why what survives
 * below measures a rendered box and calculates nothing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What survives: the page's own floor
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **iOS does not shrink the layout viewport for a keyboard** — it ignores
 * `interactive-widget: resizes-content`, see app/layout.tsx. So the foot of the
 * document is behind the keys, and at maximum scroll the last lines are parked
 * in there with no range left to lift them out. `--keyboard-overlap` is how much
 * is covered, and `page-hem` adds it to the page's bottom padding so the record
 * can always be scrolled clear of the keyboard.
 *
 * Measured off a rendered box rather than derived from `innerHeight` or
 * `clientHeight` — those numbers mean different things to different browsers
 * with a keyboard open, and a rendered box does not. It is zero whenever there
 * is no keyboard.
 *
 * ⚠ **It is written as a custom property, not as `paddingBottom`**, because the
 * element that needs it already has a padding rule with the foot's height in it.
 * Setting the property adds a term; setting the padding would replace it.
 *
 * ⚠ **Nothing else may read it as "a keyboard is up".** That is the mistake this
 * page shipped on 24 August: the recede consulted it every frame, and in a
 * Safari tab the gap it measures opens and closes while the **address bar**
 * collapses during a scroll — so the chrome flickered for the length of every
 * scroll. The number is honest about what it measures. It is not a keyboard
 * detector, and there is deliberately no `keyboardUp` helper anywhere.
 *
 * **Written straight to the element rather than through state.**
 * `visualViewport` emits `scroll` continuously while a finger is down, and a
 * re-render per event is how a page starts dropping frames while it is read.
 */
/*
  ⚠ **One measurement, one consumer — 27 August.** This used to do two jobs: the
  page's bottom hem, and a correction that held the pinned live band on the
  visible viewport's top edge. The field is summoned onto the *bottom* edge now
  and positions itself from `--keyboard-overlap`, so the second job is the first
  one read by somebody else. See `writing-sheet` in globals.css.
*/
export function useKeyboardHem({
  writing,
  host,
  floorAnchor,
}: {
  /**
   * Somebody is writing — which is the keyboard being asked for.
   *
   * ⚠ **Not `focused`, and the probe caught why.** The live line carries
   * `autoFocus`, so the field is focused before anybody has touched the screen
   * and React may never see a `focus` event at all — this hook simply did not
   * mount, and its corrections never ran. `writing` is set by the gesture that
   * asks for a keyboard, which is the only thing either of the two jobs below
   * cares about.
   *
   * That is the fourth thing on this page that has had to come off focus, after
   * the chrome hold, the writing pane and the row light. Focus is the resting
   * state of this page, not an event.
   */
  writing: boolean
  /** Where `--keyboard-overlap` is written. It has to inherit down to the page. */
  host: React.RefObject<HTMLElement | null>
  /** A zero-height fixed twin on the viewport's bottom edge — see `floor`. */
  floorAnchor: React.RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!writing || !vv) return

    let frame = 0
    let until = 0

    /*
      Captured for the cleanup rather than read from the ref there, which would
      be reading it after React may have pointed it somewhere else.
    */
    const hostEl = host.current

    const floor = () => {
      const box = host.current
      const edge = floorAnchor.current
      if (!box || !edge) return
      /*
        ⚠⚠⚠ **THE `Math.max(0, …)` IS A TOMBSTONE. UNCLAMPING THIS WAS TRIED ON
        8 SEPTEMBER AND THE STRIP DISAPPEARED. DO NOT DO IT AGAIN.**

        **The reasoning was sound and the result was much worse.** The raw
        quantity is where the visible bottom of the screen is in the layout
        coordinates a `fixed` box paints in — `H − offsetTop − vv.height` — and
        while iOS pans with no keyboard yet that value is **negative**: the strip
        would have to be pushed *below* the layout bottom to stay still on screen
        while every `fixed` box is dragged up. The clamp forbids exactly that,
        which is why the strip rode the whole pan upward. **All of that is true.**

        ⚠⚠ **AND IT MADE THE ERROR TWO-SIDED.** Reported within minutes: *it goes
        up significantly above the keyboard before disappearing altogether.*
        Clamped, the worst case is riding the pan **up**. Unclamped, a negative
        lift applied in a frame where the pan has already unwound pushes the
        strip **down** by the same magnitude — behind the keyboard, off the
        screen. **A composer that vanishes when you tap it is worse than any
        jolt**, which is the same verdict the in-flow attempt got on 7 September
        and for the same underlying reason.

        ⚠⚠ **THIS IS THE THIRD INDEPENDENT CONFIRMATION OF ONE LAW: A MAIN-THREAD
        CORRECTION CANNOT CANCEL A COMPOSITOR PAN.** `top: var(--viewport-top)`
        on the bar, measured worse three ways (7 Sep, `bar.tsx`); the strip taken
        out of `fixed` into an `h-dvh` column, which fixed the jolt and broke
        three things (7 Sep, `writing-sheet`); and this. **The frame of lateness
        is not a tuning problem, it is the whole of the mechanism.**

        ⚠ **So the clamp is not conservatism, it is the cheaper error.** It keeps
        every mistake on one side and bounded by the pan; without it the same
        lateness costs twice as much in both directions.

        ⚠⚠ **WHAT IS LEFT IS TO STOP THE PAN, NOT TO CHASE IT.** iOS pans to
        reveal the focused field; it has nothing to reveal if the strip is
        already clear of where the keyboard will be **at the moment focus
        happens**. That needs the keyboard's height before the keyboard exists,
        which can only come from remembering the last one this device reported.
        **Not built, and it is a mechanism rather than a subtraction** — read
        `docs/re-direction/the-rail-and-the-keyboard.md` before starting.
      */
      const overlap = Math.max(
        0,
        edge.getBoundingClientRect().bottom - (vv.offsetTop + vv.height),
      )
      box.style.setProperty('--keyboard-overlap', `${Math.round(overlap)}px`)

      /*
        ⚠⚠ **`--keyboard-height` WAS WRITTEN HERE AND IS DELETED — 7 September,
        the same day it landed. It is a TOMBSTONE, not a gap to fill.**

        It measured `clientHeight - visualViewport.height` every frame, and its
        one consumer was `--sheet-clearance`, which spent the notch's inset
        *less* this height so the strip would stop reserving the home
        indicator's clearance while a keyboard covered the indicator.

        ⚠ **It fixed the dead space and bought a jolt.** Reported within hours:
        *tapping the card in the home app, the strip frequently — more than not —
        jolts before settling; this does not happen on the Safari page.* Measured
        with the inset overridden, the card travels **18.37px at inset 34 and
        0.00px at inset 0** as the term ramps — the reported pair of surfaces,
        exactly.

        ⚠⚠ **THE FAULT IS THE SHAPE, NOT THE ARITHMETIC.** A continuous
        measurement was answering a binary question, so the whole step was spent
        at whichever frame the ramp crossed the clamp — on the main thread,
        against a pan and a resize iOS runs on the compositor. **Intermittent
        because the frame it lands on moves.**

        ⚠ **The question — *is the keyboard over the home indicator* — is a state
        this app already holds as `writing`**, which is what `sheet-over-keys`
        reads. That is CLAUDE.md's own standing rule, written twice about
        `--keyboard-overlap`, and this file's own warning that its numbers are
        not keyboard detectors. **Do not write a keyboard's height from here
        again.** If something genuinely needs the number rather than the state,
        it needs a reason this note does not anticipate.
      */

      /*
        ⚠⚠ **HOW FAR iOS HAS PANNED THE PAGE UP TO REVEAL THE FIELD — 6
        September, and this is `head()` returning under its own terms.** The
        note below says it in writing: *if a top-pinned field ever comes back,
        so does this.* **The rail is that.** Reported from an installed app the
        day the browse half landed: *the picture rail moves up, with the upper
        part obscured as it's essentially off screen.*

        ⚠ **It is the visual viewport's offset, not a scroll position.** iOS
        pans the visual viewport over a document that has nothing to scroll —
        `window.scrollY` stays 0 through the whole thing, which is why
        `chrome-recede.ts`'s lesson applies here too: **the only honest
        measurement of where the page has gone is `visualViewport`.**

        ⚠ **Written for every consumer, used by whoever is anchored to the
        top.** The sheet does not need it — it is on the bottom edge and already
        rides `--keyboard-overlap` — so this is deliberately a property rather
        than a transform applied here. **Nothing is moved by this function.**
      */
      box.style.setProperty('--viewport-top', `${Math.round(vv.offsetTop)}px`)
    }

    /*
      ⚠ **`head()` was here and is deleted — 27 August.** It held the *pinned*
      live band on the visible viewport's top edge, correcting for iOS dragging
      every `position: fixed` element up when it scrolls to reveal a focused
      field. There is no pinned band: the field is summoned and arrives on the
      bottom edge, where `floor()`'s own measurement already puts it — the sheet
      reads `--keyboard-overlap` for its `bottom`, so the correction and the
      position are one number instead of two.

      ⚠ **If a top-pinned field ever comes back, so does this.** The symptom it
      answered is real and was reported: tap the live line after scrolling and
      the band bumps up to the status bar before dropping back. It is only
      unreachable because nothing is pinned to the top any more.
    */

    /*
      ─────────────────────────────────────────────────────────────────────────
       One frame for an event, every frame for an animation
      ─────────────────────────────────────────────────────────────────────────

      A measurement scheduled from an event is always one frame behind the event,
      and a keyboard is not an event — it is a three-hundred-millisecond
      animation that reports its progress in steps. So a viewport change holds
      the loop open for the length of the animation and re-measures every frame,
      while a scroll — genuinely a discrete event — still costs exactly one.
    */
    const run = () => {
      frame = 0
      floor()
      frame = performance.now() < until ? requestAnimationFrame(run) : 0
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }

    const hold = () => {
      until = performance.now() + KEYBOARD_ARRIVAL_MS
      schedule()
    }

    /* The effect re-runs on the gesture, which is the keyboard being asked for. */
    hold()

    /*
      `resize` and `orientationchange` are here because turning a handset
      sideways moves every one of these numbers with a keyboard still open.
    */
    window.addEventListener('scroll', schedule, { passive: true })
    /* The four that mean "something is animating", not "something happened". */
    vv.addEventListener('resize', hold)
    vv.addEventListener('scroll', hold)
    window.addEventListener('resize', hold)
    window.addEventListener('orientationchange', hold)

    /*
      ⚠ **There was a sixth listener here for four hours on 25 August, and it is
      deleted rather than kept as a backstop.** `visibilitychange` re-opened the
      measuring window on resume, because `requestAnimationFrame` does not run
      while the document is hidden — so a keyboard taken away during a
      background fired its viewport events into a loop that could not execute,
      and `--keyboard-overlap` kept a keyboard's worth of dead space with no
      keyboard in it. It worked, and it was the wrong altitude.

      **The page now drops `writing` on resume** — see the resume effect in
      `page-screen.tsx` — because focus does not survive a background on glass
      and a page claiming a keyboard it has lost is the actual fault. That
      *unmounts this effect*, and the cleanup below already removes both the
      property and the band's transform. The condition is gone, so the
      correction for it goes too, per *How things get fixed* in CLAUDE.md.

      ⚠ **If `writing` ever legitimately outlives a background, this comes
      back.** The stale-measurement bug is real; it is only unreachable because
      nothing keeps the flag across a resume where an on-screen keyboard exists.
    */

    return () => {
      window.removeEventListener('scroll', schedule)
      vv.removeEventListener('resize', hold)
      vv.removeEventListener('scroll', hold)
      window.removeEventListener('resize', hold)
      window.removeEventListener('orientationchange', hold)
      if (frame) cancelAnimationFrame(frame)

      /*
        The hem goes the moment the keyboard is not there, or the page keeps a
        keyboard's worth of dead space under it for the rest of the session.
      */
      hostEl?.style.removeProperty('--keyboard-overlap')
      hostEl?.style.removeProperty('--viewport-top')
    }
  }, [writing, host, floorAnchor])
}
