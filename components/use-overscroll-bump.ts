'use client'

import { useEffect, type RefObject } from 'react'

/**
 * A small rubber band at the ends of the page.
 *
 * The native one went with pull-to-refresh: `overscroll-behavior-y: none` is the
 * only value that suppresses the browser's overscroll *action*, and it takes the
 * bounce with it — `contain` keeps the bounce and keeps the refresh, which is
 * the pair we were trying to separate. So the bounce is rebuilt here, without
 * the reload attached to it.
 *
 * **It moves the content, not the page.** The element passed in is `main`; the
 * mark and the bottom bar stay put. That is not a shortcut — the header is
 * sticky and content already passes underneath it, so content sliding a little
 * further under the mark is the motion the layout already implies. Moving the
 * whole shell would drag a fixed bar off the bottom of the screen.
 *
 * ⚠ Transforms create a containing block for `position: fixed` descendants.
 * Nothing inside `main` is fixed — the intent sheet and the acknowledgement
 * toast are rendered by `CaptureProvider` *outside* the shell, and a modal
 * `<dialog>` sits in the top layer, which no ancestor transform reaches. Putting
 * anything fixed inside `main` would break here first.
 */

/** How far the content can be dragged past the end. */
const MAX_PULL = 24
/**
 * Resistance. The pull approaches `MAX_PULL` asymptotically and starts at half
 * the speed of the finger, which is what makes it read as elastic rather than as
 * the page simply moving — a linear pull with a cap feels like a stuck drawer.
 */
const RESIST = MAX_PULL * 2
/** The spring back. Long enough to see, short enough not to be in the way. */
const RELEASE_MS = 320

export function useOverscrollBump(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Reduced motion means no invented movement at all. The native bounce is
    // already gone, so doing nothing here is the honest reading of the setting.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let originY = 0
    let pull = 0

    /*
      No `(pointer: coarse)` check. `touchstart` is the gate — it does not fire
      on a device without a touchscreen, and a media query would additionally
      exclude laptops that have one.
    */
    const onStart = (e: TouchEvent) => {
      originY = e.touches[0]?.clientY ?? 0
      pull = 0
      el.style.transition = ''
    }

    const onMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (y === undefined) return

      const dy = y - originY
      const atTop = window.scrollY <= 0
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 1

      if (atTop && dy > 0) pull = damp(dy)
      else if (atBottom && dy < 0) pull = -damp(-dy)
      else {
        /*
          Mid-scroll: keep the origin under the finger so that arriving at an end
          starts the pull from zero. Without this the bump would jump to full
          stretch the instant a long flick reached the top.
        */
        originY = y
        pull = 0
      }

      el.style.transform = pull === 0 ? '' : `translate3d(0, ${pull.toFixed(2)}px, 0)`
    }

    const onEnd = () => {
      if (pull === 0) return
      pull = 0
      el.style.transition = `transform ${RELEASE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      el.style.transform = ''
    }

    // Passive: this never calls preventDefault. It does not need to — with
    // `overscroll-behavior-y: none` the browser does nothing at the ends, so
    // there is no default to suppress, and a non-passive listener on touchmove
    // would cost scrolling performance on every gesture in the app.
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
      el.style.transform = ''
      el.style.transition = ''
    }
  }, [ref])
}

/** Asymptotic towards `MAX_PULL`, opening at half the finger's speed. */
function damp(distance: number) {
  return MAX_PULL * (1 - Math.exp(-distance / RESIST))
}
