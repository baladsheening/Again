'use client'

import { useEffect } from 'react'

/*
  How long iOS takes to bring a keyboard up. The same window `keyboard-hem.ts`
  uses, and for the same reason: the platform emits no event when the animation
  ends, so the only honest way to follow it is to keep measuring for as long as
  it can still be moving.
*/
const KEYBOARD_ARRIVAL_MS = 700

/**
 * **Make one element the visible viewport, and put everything else in flow
 * inside it — 7 September.**
 *
 * ⚠⚠ **THIS EXISTS BECAUSE THREE FIXED ELEMENTS EACH ANSWERED THE SAME iOS
 * KEYBOARD PAN DIFFERENTLY, AND TWO OF THEM ANSWERED IT IN OPPOSITE
 * DIRECTIONS.** The bar did not correct at all and left the screen, the
 * composer's sheet corrected itself up, the rail corrected itself down — so on a
 * panned tap the rail walked into the composer and showed through its glass.
 * One box is pinned to the visible area now and everything else is an ordinary
 * flex child of it, so there is nothing left that can disagree.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The one measured fact this rests on
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **`visualViewport.offsetTop + visualViewport.height === clientHeight`, IN
 * EVERY SAMPLE OF EVERY TRACE TAKEN ON THE HANDSET.** `0 + 660`, `271 + 389`,
 * `202 + 458`, `187 + 473` — always 660. **The visible region's bottom edge is
 * always the layout viewport's bottom edge**; a keyboard only ever eats it from
 * the top.
 *
 * ⚠⚠ **SO THE HOST IS ANCHORED TO `bottom: 0` AND SIZED BY `height`, AND THERE
 * IS NO `--vv-top`.** `screen-viewport` needs one number, read at one instant,
 * and it lands on the visible region exactly. **Nothing is corrected, so nothing
 * can lag** — which is what two earlier versions of this file got wrong.
 *
 * ⚠ **`--vv-top` was the whole defect and it is DELETED.** It held
 * `visualViewport.offsetTop` and the host took it as `top`. iOS reports that
 * number in the frame *after* it has already moved the page, so the screen went
 * up and came back down on every tap — reported as *the page, the images and
 * the logo row go up then come down*. ⚠⚠ **DO NOT REINTRODUCE A TOP-ANCHORED
 * CORRECTION.** Any position taken from `offsetTop` is a frame behind by
 * construction.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two things that were tried, measured, and are dead
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **ANTICIPATING THE KEYBOARD DOES NOT PREVENT THE PAN.** The screen was
 * shrunk in the focus's own frame from a remembered height, on the reasoning
 * that iOS pans to reveal a field the keyboard would cover. The trace shows the
 * anticipation working — `hh 389` at `t=60`, before any keyboard — **and iOS
 * panning anyway at `t=87`.** A field inside a `position: fixed` host cannot be
 * brought into view by scrolling the document, so iOS scrolls the whole range it
 * invented and gives up. **The reveal was never the trigger.** With a
 * bottom-anchored host the anticipation would also be actively wrong: it would
 * hold the screen 271px low for the 27ms before the keyboard arrives.
 *
 * ⚠⚠ **AND PUTTING THE SCROLL BACK STARTS A FIGHT THAT LASTS SECONDS.** iOS
 * invents scroll range the height of the keyboard and scrolls to the end of it,
 * so `window.scrollY` reads 271 on a page with nothing to scroll. A synchronous
 * `scrollTo(0, 0)` in the scroll handler looked like a subtraction and was not:
 * the trace shows `off` grinding **down one pixel per frame** — 202, 201, 200,
 * … — **still going 2.5 seconds after the tap**, with the viewport growing a
 * pixel at a time to match. ⚠ **Never fight the platform's scroll here.** The
 * bottom anchor makes the scroll irrelevant rather than contested.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The rest
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **`--keyboard-overlap` no longer positions anything and keeps one job**: the
 * sheet's safe-area clearance, spent when the bottom of the screen is the bottom
 * of the *device* and not when it is the top of a keyboard. It is
 * `clientHeight − visualViewport.height`. ⚠ **The floor anchor it used to be
 * measured against is DELETED** — a `fixed` element's rect is reported against
 * the **visual** viewport on iOS, which the trace proves outright (a host at
 * `top: 0` read `top: -271`), so with the page panned that ruler read `vvh`,
 * the subtraction came out negative, clamped to zero, and **the clearance was
 * silently spent under an open keyboard on every notched handset.**
 *
 * ⚠ **None of these are keyboard detectors and nothing may read them as one.**
 * `keyboard-hem.ts` has the account: the gap they measure also opens when a
 * Safari tab's address bar collapses during a scroll. They are lengths.
 *
 * ⚠ **It runs always, not only while somebody is writing.** The host has to be
 * the right size on the first paint too — and sizing it to a measured
 * `visualViewport.height` is what stops the installed app laying out short
 * before its first drag, which `100svh` does not.
 *
 * ⚠ **Written straight to the element, never through state.** `visualViewport`
 * emits `scroll` continuously while a finger is down; a re-render per event is
 * how a page starts dropping frames while it is being read. §10 blocks inline
 * `style` attributes and the CSSOM is the door that rule leaves open.
 *
 * ⚠ **The property is written on the HOST and read on the host and its
 * descendants.** A `var()` is substituted where it is *declared*, so this may
 * never be lifted into `@theme`: a token on `:root` would resolve against
 * `:root`, where nothing writes it. That bug cost a day on 29 August.
 *
 * ⚠ **`useKeyboardHem` is untouched and still owns the record.** `/record`
 * scrolls a document, which this arrangement would have to replace with an
 * inner scroller — a bigger change and a separate one.
 */
export function useVisualViewport({
  host,
}: {
  /** The one element pinned to the visible area; everything else is in flow inside it. */
  host: React.RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let frame = 0
    let until = 0
    const hostEl = host.current

    const write = () => {
      const box = host.current
      if (!box) return

      const height = Math.round(vv.height)
      box.style.setProperty('--vv-height', `${height}px`)

      const covered = Math.max(0, document.documentElement.clientHeight - height)
      box.style.setProperty('--keyboard-overlap', `${covered}px`)
    }

    const run = () => {
      frame = 0
      write()
      frame = performance.now() < until ? requestAnimationFrame(run) : 0
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }

    /* Keep measuring for as long as a keyboard could still be arriving. */
    const hold = () => {
      until = performance.now() + KEYBOARD_ARRIVAL_MS
      schedule()
    }

    hold()

    /*
      ⚠ **`focusin`/`focusout` are here because the keyboard has no event of its
      own.** iOS raises one when a field takes focus, and it can begin without
      `visualViewport` emitting anything on the same frame.
    */
    window.addEventListener('focusin', hold)
    window.addEventListener('focusout', hold)
    window.addEventListener('scroll', schedule, { passive: true })
    vv.addEventListener('resize', hold)
    vv.addEventListener('scroll', hold)
    window.addEventListener('resize', hold)
    window.addEventListener('orientationchange', hold)

    return () => {
      window.removeEventListener('focusin', hold)
      window.removeEventListener('focusout', hold)
      window.removeEventListener('scroll', schedule)
      vv.removeEventListener('resize', hold)
      vv.removeEventListener('scroll', hold)
      window.removeEventListener('resize', hold)
      window.removeEventListener('orientationchange', hold)
      if (frame) cancelAnimationFrame(frame)

      hostEl?.style.removeProperty('--vv-height')
      hostEl?.style.removeProperty('--keyboard-overlap')
    }
  }, [host])
}
