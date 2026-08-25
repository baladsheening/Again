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
export function useKeyboardHem({
  writing,
  host,
  floorAnchor,
  band,
  bandAnchor,
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
  /** The live band, held on the top edge of the visible area — see `head`. */
  band: React.RefObject<HTMLElement | null>
  /** A zero-height fixed twin on the viewport's top edge — see `head`. */
  bandAnchor: React.RefObject<HTMLElement | null>
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
    const bandEl = band.current

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

    /**
     * **The live band, held on the top edge of the visible area.**
     *
     * ⚠ **The symptom, reported on a handset:** tap the live line after
     * scrolling and the band bumps up to the status bar before dropping back
     * into place. It does not happen at the top of the record, which is the tell
     * — there has to be somewhere for the document to be dragged *from*.
     *
     * This file's own history has it in one line: on 11 August, focusing a field
     * made iOS scroll the document to reveal it — 271px in a tab, 333 standalone
     * — **dragging every `position: fixed` element up with it, the header
     * included.** A lock and a pre-emptive lift used to answer that; both were
     * removed as the design changed, and with the band now pinned at the top the
     * old symptom came back on a new element.
     *
     * ⚠ **A thermostat, not a model.** It reads the position back off an
     * untouched twin and corrects the difference, which is the one approach that
     * survived five wrong versions of this at the other edge. It is a **no-op
     * whenever the visual viewport starts where the layout one does** — which is
     * every surface except an iOS keyboard mid-arrival — so if the bump turns
     * out to have a different cause this costs nothing and hides nothing.
     *
     * ⚠ **`transform`, and the band's recede is a `translate`.** Two properties,
     * composed by the browser in a fixed order, neither able to overwrite the
     * other — the same arrangement that let the foot be moved by two things
     * before one of them was deleted. **Do not write `translate` here.**
     */
    const head = () => {
      const el = band.current
      const anchor = bandAnchor.current
      /*
        A `display: none` anchor measures as all zeros, and a correction computed
        from that is the height of the screen.
      */
      if (!el || !anchor || anchor.getClientRects().length === 0) return
      const lift = vv.offsetTop - anchor.getBoundingClientRect().top
      el.style.transform = lift ? `translateY(${lift}px)` : ''
    }

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
      head()
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
      ─────────────────────────────────────────────────────────────────────────
       And a fifth: coming back, because nothing could be measured while away
      ─────────────────────────────────────────────────────────────────────────

      ⚠ **Reported on a handset, 25 August:** type in the live line, background
      the app with the keyboard up, come back — and a keyboard's worth of the
      screen is still spoken for with no keyboard in it.

      ⚠ **`requestAnimationFrame` does not run while the document is hidden**,
      which is the whole of it. iOS takes the keyboard away on the way out and
      the viewport events for that fire into a loop that cannot execute; by the
      time the page is visible again `until` is long past, so unless the platform
      volunteers a fresh viewport event nothing re-measures. `--keyboard-overlap`
      and the band's `transform` then keep the values they were given while the
      keys were up, and there is no path back to zero — the cleanup only runs
      when `writing` goes false, and somebody who left mid-line is still writing.

      ⚠ **It does not need to know what happened while it was away**, which is
      why this is one line rather than a restoration. iOS sometimes brings the
      keyboard back with the focus and sometimes does not; a measurement of a
      rendered box is right either way. That is the same property that survived
      the five wrong versions above — measure the box, calculate nothing.

      `hold` rather than `schedule`, because a keyboard returning on resume is an
      animation like any other and one frame would catch it halfway.
    */
    const returned = () => {
      if (document.visibilityState === 'visible') hold()
    }
    document.addEventListener('visibilitychange', returned)

    return () => {
      window.removeEventListener('scroll', schedule)
      vv.removeEventListener('resize', hold)
      vv.removeEventListener('scroll', hold)
      window.removeEventListener('resize', hold)
      window.removeEventListener('orientationchange', hold)
      document.removeEventListener('visibilitychange', returned)
      if (frame) cancelAnimationFrame(frame)

      /*
        The hem goes the moment the keyboard is not there, or the page keeps a
        keyboard's worth of dead space under it for the rest of the session.
      */
      hostEl?.style.removeProperty('--keyboard-overlap')
      /*
        And the band goes back to where the stylesheet puts it. A stale
        correction is a band parked wherever the last keyboard left it.
      */
      if (bandEl) bandEl.style.transform = ''
    }
  }, [writing, host, floorAnchor, band, bandAnchor])
}
