'use client'

import { useEffect } from 'react'

/**
 * How long a software keyboard takes to arrive, and therefore how long the
 * correction loop below stays open after a viewport event. Generous: the cost of
 * over-running is a few idle frames, the cost of under-running is the foot
 * arriving after the keys.
 */
const KEYBOARD_ARRIVAL_MS = 700

/**
 * Holds the foot on the top edge of an open keyboard, and holds the foot of the
 * page above it.
 *
 * **Two jobs, because they are one measurement.** Both need the bottom edge of
 * the visible area, and both need re-reading on the same five events; splitting
 * them would mean a second copy of every listener to answer the same question
 * twice a frame.
 *
 * **The symptom this exists for**: with the keyboard up and a page to scroll, a
 * `fixed bottom-0` bar vanishes and comes back only at the very bottom of the
 * document. That is not a hidden bar, it is a bar parked out of sight. iOS
 * positions `fixed` against the *layout* viewport, which stays the full height
 * of the screen while the keyboard covers the bottom of it — so `bottom-0` sits
 * behind the keyboard, and it only scrolls into view when the visual viewport
 * reaches the foot of the layout one, which is the foot of the document.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It measures, it does not calculate — and that is the point
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Five versions of this computed the lift from viewport arithmetic, and every
 * one of them was wrong on a real handset in a different way: the bar rode up on
 * scroll, or stuck above the keyboard, or sat behind it. Each fix was a better
 * guess at what iOS means by `innerHeight`, `clientHeight` and `offsetTop` with
 * a keyboard open, and each guess was falsified by the next test.
 *
 * **The guessing is what was wrong, not any particular guess.** Safari may
 * anchor a `fixed` element to the layout viewport or to the visual one, and this
 * no longer needs to know which, because it reads the position back off the
 * element instead of predicting it:
 *
 *     error = rect.bottom − vv.offsetTop − vv.height
 *     lift −= error
 *
 * Under either behaviour the measurement is of what actually happened, so the
 * correction is right in both. Where the old formula was a model of the browser,
 * this is a thermostat. It settles in one frame: `transform` does not affect
 * layout, so the next `getBoundingClientRect` already includes it.
 *
 * **Written straight to the element rather than through state.**
 * `visualViewport` emits `scroll` continuously while a finger is down, and a
 * re-render per event is how a page starts dropping frames while it is read.
 *
 * ⚠ **This is `useKeyboardPin` from the film-first shell, reduced from two docks
 * to one.** That version chose between a phone bar and a rail dock by asking the
 * DOM which was laid out; the capture page has **the same foot at every width**,
 * so there is nothing to choose between and the choosing is gone. The
 * thermostat, the anchors and the frame loop are unchanged, and the reasoning
 * above is the record of five wrong versions that produced them.
 */
export function useKeyboardPin({
  focused,
  foot,
  footAnchor,
  host,
  floorAnchor,
}: {
  /** Whether the live line holds focus — which is the keyboard being asked for. */
  focused: boolean
  /** The foot itself: the element that moves. */
  foot: React.RefObject<HTMLElement | null>
  /**
   * A zero-size twin with the foot's positioning and nothing else — no
   * transform, no padding. Wherever it has ended up *is* where an untouched
   * fixed element sits on this device at this instant, including whatever iOS
   * has done to it.
   *
   * ⚠ **Measured off this rather than off the foot**, because the foot carries
   * the transform this loop is writing. Reading the foot would mean reading the
   * correction back and correcting it away.
   */
  footAnchor: React.RefObject<HTMLElement | null>
  /** Where `--keyboard-overlap` is written. It has to inherit down to the page. */
  host: React.RefObject<HTMLElement | null>
  /** A zero-height fixed twin on the viewport's bottom edge — see `floor`. */
  floorAnchor: React.RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!focused || !vv) return

    let frame = 0
    let until = 0

    /*
      Captured for the cleanup rather than read from the ref there, which would
      be reading it after React may have pointed it somewhere else.
    */
    const hostEl = host.current
    const footEl = foot.current

    const measure = () => {
      frame = 0
      const el = foot.current
      const anchor = footAnchor.current
      /*
        A `display: none` anchor measures as all zeros, and a lift computed from
        that is the height of the screen. Cheap to be sure: the failure is the
        foot leaving the screen entirely.
      */
      if (!el || !anchor || anchor.getClientRects().length === 0) return

      /*
        ⚠ **Not clamped.** It was `Math.min(0, …)` — "only ever lift, never push
        down" — which sounds safe and threw the fix away. Keyboard open at rest
        gives a correction of −271 on the handset and the foot lands right;
        scroll down and the anchor drifts up with the page, so by 300px the
        correction wanted is *positive*. The clamp discarded exactly that, which
        is why the bar floated mid-page from a few hundred pixels in.
      */
      const lift = vv.offsetTop + vv.height - anchor.getBoundingClientRect().bottom
      el.style.transform = lift ? `translateY(${lift}px)` : ''
    }

    /*
      **The floor of the page, held above the keyboard — see `page-hem`.**

      **iOS does not shrink the layout viewport for a keyboard** — it ignores
      `interactive-widget: resizes-content`, see app/layout.tsx. So the foot of
      the page is behind the keys, and at maximum scroll the last line is parked
      in there with no range left to lift it out. On a page you type *downward*
      that is not a corner case: the line being written is the last one.

      Measured, like the pin above, rather than derived from `innerHeight` or
      `clientHeight` — those numbers mean different things to different browsers
      with a keyboard open, and a rendered box does not. It is zero whenever
      there is no keyboard.

      Written as a custom property rather than as `paddingBottom`, because the
      element that needs it already has a padding rule with the foot's height in
      it. Setting the property adds a term; setting the padding would replace it.
    */
    const floor = () => {
      const box = host.current
      const edge = floorAnchor.current
      if (!box || !edge) return
      const overlap = Math.max(
        0,
        edge.getBoundingClientRect().bottom - (vv.offsetTop + vv.height),
      )
      box.style.setProperty('--keyboard-overlap', `${Math.round(overlap)}px`)
    }

    /*
      ─────────────────────────────────────────────────────────────────────────
       One frame for an event, every frame for an animation
      ─────────────────────────────────────────────────────────────────────────

      A correction scheduled from an event is always one frame behind the event,
      and a keyboard is not an event — it is a three-hundred-millisecond
      animation that reports its progress in steps. Correcting once per step
      means the foot is visibly chasing it up the screen.

      So a viewport change holds the loop open for the length of the animation
      and re-measures every frame, while a scroll — genuinely a discrete event —
      still costs exactly one.
    */
    const run = () => {
      measure()
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

    /* The effect re-runs on focus, which is the keyboard being asked for. */
    hold()

    /*
      The backstop. It reads the foot's real position and corrects whatever
      displaced it without needing to know what did — a thermostat does not care
      why the room got cold, which is exactly why it survives a change of cause.

      `resize` and `orientationchange` are here because turning a handset
      sideways moves every one of these numbers with a keyboard still open.
    */
    window.addEventListener('scroll', schedule, { passive: true })
    /* The four that mean "something is animating", not "something happened". */
    vv.addEventListener('resize', hold)
    vv.addEventListener('scroll', hold)
    window.addEventListener('resize', hold)
    window.addEventListener('orientationchange', hold)

    return () => {
      window.removeEventListener('scroll', schedule)
      vv.removeEventListener('resize', hold)
      vv.removeEventListener('scroll', hold)
      window.removeEventListener('resize', hold)
      window.removeEventListener('orientationchange', hold)
      if (frame) cancelAnimationFrame(frame)

      /* Back to the resting position the moment the keyboard is not there. */
      if (footEl) footEl.style.transform = ''
      /*
        And the floor with it, or the page keeps a keyboard's worth of dead space
        under it for the rest of the session.
      */
      hostEl?.style.removeProperty('--keyboard-overlap')
    }
  }, [focused, foot, footAnchor, host, floorAnchor])
}
