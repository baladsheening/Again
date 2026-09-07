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
 * ⚠⚠ **THIS EXISTS BECAUSE THREE FIXED ELEMENTS EACH ANSWERED THE SAME PAN
 * DIFFERENTLY, AND TWO OF THEM ANSWERED IT IN OPPOSITE DIRECTIONS.** iOS does
 * not shrink the layout viewport for a keyboard — `app/layout.tsx` records the
 * measurement — it offsets the **visual** viewport inside a layout viewport
 * that keeps its full height. Every `position: fixed` box is anchored to the
 * layout one, so on a pan every one of them is wrong, and the front page had
 * three of them correcting separately:
 *
 * - `Bar` — `fixed; top: 0`, **no correction at all**, so it left the screen.
 * - the composer's sheet — `fixed; bottom: var(--keyboard-overlap)`, corrected
 *   **up**.
 * - the rail — `translate-y: var(--viewport-top)`, corrected **down**.
 *
 * The rail walked into the composer, the composer is glass, and the pictures
 * showed straight through it. Reported from a handset on 7 September with a
 * screenshot of exactly that.
 *
 * ⚠⚠ **A FOURTH CORRECTION WOULD HAVE BEEN A FOURTH THING TO DISAGREE.** *How
 * things get fixed* asks for the mechanism to be removed before it is
 * corrected, and the mechanism here is *many boxes each pinned to the wrong
 * viewport*. So: **one box is pinned to the visual viewport and everything else
 * is in ordinary flow inside it.** There is nothing left that can drift,
 * because there is only one thing being positioned.
 *
 * ⚠ **What the caller gets, and it is the whole point: the host's box IS the
 * visible area.** A composer at the flex end sits on the keyboard's top edge
 * with no arithmetic; a third of the host is a third of what the reader can
 * see; the rail fills what is left. None of those need to know a keyboard
 * exists.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The three lengths
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - **`--vv-top`** is `visualViewport.offsetTop`: how far iOS has panned. The
 *   host takes it as `top`, so the host's top edge is the visible top edge.
 * - **`--vv-height`** is `visualViewport.height`: what is left after the
 *   keyboard. The host takes it as `height`.
 * - **`--keyboard-overlap`** is what it always was — how much of the layout
 *   viewport's bottom is covered. **It no longer positions anything.** Its one
 *   remaining reader is the sheet's safe-area clearance, which must be spent
 *   when the bottom of the screen is the bottom of the *device* and not when it
 *   is the top of a keyboard.
 *
 * ⚠ **`top`, deliberately, and NOT a `transform`.** A transform makes its
 * element the containing block for every `position: fixed` descendant — and
 * there are two inside this host: the floor anchor below, and the desk's tool
 * stack in `foot.tsx`. Both would silently start resolving against the host.
 * A transform is the cheaper property to animate; a trap that fires only on the
 * desk, only in one component, is not worth the frames. The subtree is a bar, a
 * row of pictures and a card.
 *
 * ⚠ **None of these are keyboard detectors and nothing may read them as one.**
 * `keyboard-hem.ts` has the full account: the gap they measure also opens when
 * a Safari tab's address bar collapses during a scroll. They are lengths.
 *
 * ⚠ **It runs always, not only while somebody is writing.** The host has to be
 * the right size on the first paint too — and sizing it to a measured
 * `visualViewport.height` is also what stops the installed app laying out short
 * before its first drag, which `100svh` does not.
 *
 * ⚠ **Written straight to the element, never through state.** `visualViewport`
 * emits `scroll` continuously while a finger is down; a re-render per event is
 * how a page starts dropping frames while it is being read. §10 blocks inline
 * `style` attributes and the CSSOM is the door that rule leaves open — the same
 * one `useKeyboardHem` and the console's settle already use.
 *
 * ⚠ **The properties are written on the HOST and read on the host and its
 * descendants.** A `var()` is substituted where the property is *declared*, so
 * none of this may ever be lifted into `@theme`: a token on `:root` would
 * resolve against `:root`, where nothing writes it. That bug cost a day on 29
 * August and is recorded in `globals.css`.
 *
 * ⚠ **`useKeyboardHem` is untouched and still owns the record.** `/record`
 * scrolls a document, which this arrangement would have to replace with an
 * inner scroller — a bigger change and a separate one. Two hooks is the honest
 * state of the tree until that is done, not a duplication to tidy.
 */
export function useVisualViewport({
  host,
  floorAnchor,
}: {
  /** The one element pinned to the visual viewport; everything else is in flow inside it. */
  host: React.RefObject<HTMLElement | null>
  /** A zero-height `fixed` twin on the layout viewport's bottom edge — the ruler. */
  floorAnchor: React.RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let frame = 0
    let until = 0
    const hostEl = host.current

    const write = () => {
      const box = host.current
      const edge = floorAnchor.current
      if (!box || !edge) return

      box.style.setProperty('--vv-top', `${Math.round(vv.offsetTop)}px`)
      box.style.setProperty('--vv-height', `${Math.round(vv.height)}px`)

      /*
        ⚠ **Measured off a rendered box, never derived from `innerHeight` or
        `clientHeight`.** Those numbers mean different things to different
        browsers with a keyboard open; a rendered box does not. Five versions of
        `keyboard-hem.ts` were falsified one after another for guessing here,
        and the lesson outlived the code.
      */
      const overlap = Math.max(
        0,
        edge.getBoundingClientRect().bottom - (vv.offsetTop + vv.height),
      )
      box.style.setProperty('--keyboard-overlap', `${Math.round(overlap)}px`)
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
      ⚠ **`focusin`/`focusout` are here because the pan has no event of its
      own.** iOS decides to pan when a field takes focus, and it can do it
      without `visualViewport` emitting anything on the same frame. The old hook
      got this for free by mounting its effect on `writing`; this one runs
      always, so the focus has to be listened for.
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

      hostEl?.style.removeProperty('--vv-top')
      hostEl?.style.removeProperty('--vv-height')
      hostEl?.style.removeProperty('--keyboard-overlap')
    }
  }, [host, floorAnchor])
}
