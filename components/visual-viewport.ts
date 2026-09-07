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
 * **What this device's visible area measured last time, at rest and while
 * somebody was writing — keyed by the viewport's width, so a rotation gets its
 * own pair.**
 *
 * ⚠⚠ **THIS EXISTS TO STOP iOS PANNING, WHICH IS THE ONLY WAY TO STOP THE
 * SCREEN GOING UP AND COMING BACK DOWN.** Reported 7 September: *I tap in the
 * composer and the page, the images and the logo row go up then come down.*
 * That is the pan and our correction, in that order — and it cannot be fixed by
 * correcting sooner, because **iOS does not publish `visualViewport.offsetTop`
 * while it is animating.** The value arrives when the animation is over, so
 * anything that follows it lands after the excursion has already been seen.
 *
 * ⚠ **So the screen shrinks BEFORE the keyboard, not after it.** iOS pans to
 * reveal a focused field it believes the keyboard will cover; if the field is
 * already above the keyboard's line when it looks, there is nothing to reveal
 * and no pan. The only thing missing at that instant is how tall the keyboard
 * is — so the app remembers what it was.
 *
 * ⚠⚠ **IT REMEMBERS A VISIBLE HEIGHT, NOT A KEYBOARD HEIGHT, AND THAT IS
 * DELIBERATE.** A keyboard height would have to be derived from
 * `innerHeight`/`clientHeight`/`offsetTop` arithmetic with a keyboard open —
 * exactly the guessing that falsified five versions of `keyboard-hem.ts` one
 * after another. `visualViewport.height` is one number the platform states
 * outright, and *what it was last time somebody wrote* needs no arithmetic at
 * all.
 *
 * ⚠ **Not a tuned constant.** Nothing is typed in: both numbers are this
 * device's own measurements at this width, and where there is no measurement
 * yet the optimism simply does not happen and the screen behaves as it did
 * before. ⚠ **The stated cost: the FIRST focus after a cold load still pans
 * once**, because there is nothing to remember yet. It is module scope rather
 * than storage, so it survives a client navigation and a resume but not a
 * reload — and this app introduces no web storage anywhere.
 *
 * ⚠ **It is self-gating on the desk.** A pointer device never shrinks the
 * visible area on focus, so `WHILE_WRITING` is never filled up there and the
 * optimism never fires. **There is no pointer sniff and there must not be one.**
 */
const AT_REST = new Map<number, number>()
const WHILE_WRITING = new Map<number, number>()

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

    /* Somebody is writing in this host — set by the focus, not by the DOM. */
    let writing = false
    /*
      The height written ahead of the keyboard, held until the keyboard either
      arrives or the burst gives up. Zero when nothing is being anticipated.
    */
    let expecting = 0

    const write = () => {
      const box = host.current
      const edge = floorAnchor.current
      if (!box || !edge) return

      const width = Math.round(vv.width)
      const height = Math.round(vv.height)

      box.style.setProperty('--vv-top', `${Math.round(vv.offsetTop)}px`)

      /*
        ⚠ **The anticipated height is held until the keyboard actually arrives.**
        Without this the next frame writes the full height straight back over it
        — the keyboard has not opened yet — and the optimism is undone before
        iOS has even looked. It is let go the moment the real height is no
        bigger than what was anticipated, and unconditionally when the burst
        ends, so a focus that never raises a keyboard corrects itself.
      */
      if (expecting && height > expecting) {
        /* Held. */
      } else {
        expecting = 0
        box.style.setProperty('--vv-height', `${height}px`)
      }

      /*
        What to anticipate next time. ⚠ **At rest is only ever recorded while
        nothing is focused**, or the shrunken height would become the resting
        one and the screen would never grow back.
      */
      if (writing) {
        const rest = AT_REST.get(width)
        if (rest !== undefined && height < rest) WHILE_WRITING.set(width, height)
      } else {
        /*
          ⚠ **The LARGEST height seen at this width, never the latest.** A blur
          is instant and the keyboard takes a third of a second to leave, so for
          those frames nothing is focused and the visible area is still short —
          and a latest-wins record would file that as the resting height, after
          which nothing is ever *smaller than rest* and the anticipation never
          fires again. **It also makes an address bar collapsing during a scroll
          a non-event**, which is the same trap in a second costume.
        */
        AT_REST.set(width, Math.max(AT_REST.get(width) ?? 0, height))
      }

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
      if (performance.now() < until) {
        frame = requestAnimationFrame(run)
      } else if (expecting) {
        /* The burst is over and no keyboard came. Take the real height. */
        expecting = 0
        write()
      }
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

    /**
     * **Shrink the screen in the focus's own frame, before iOS decides whether
     * to pan.**
     *
     * ⚠⚠ **THIS IS THE WHOLE FIX FOR THE SCREEN GOING UP AND COMING BACK
     * DOWN.** iOS looks at the focused field after this handler has run; if the
     * host is already the height it will be with a keyboard up, the composer is
     * above the keyboard's line and there is nothing to scroll into view.
     *
     * ⚠ **The layout is forced before returning.** Writing a style marks layout
     * dirty and nothing is obliged to resolve it until the next frame — which
     * is after iOS has looked. Reading `offsetHeight` is what makes the new
     * height true *now* rather than in 16ms.
     *
     * ⚠ **Only a field inside this host.** A focus on the profile link or the
     * record's door raises no keyboard, and shrinking the screen for one would
     * be a bar jumping for a tap that did nothing.
     */
    const focused = (e: FocusEvent) => {
      hold()
      const box = host.current
      const target = e.target
      if (
        !box ||
        !(target instanceof Element) ||
        !box.contains(target) ||
        !target.matches('textarea, input')
      ) {
        return
      }

      writing = true
      const remembered = WHILE_WRITING.get(Math.round(vv.width))
      if (remembered === undefined || remembered >= vv.height) return

      expecting = remembered
      box.style.setProperty('--vv-height', `${remembered}px`)
      void box.offsetHeight
    }

    const blurred = () => {
      writing = false
      expecting = 0
      hold()
    }

    /*
      ⚠ **`focusin`/`focusout` are here because the pan has no event of its
      own.** iOS decides to pan when a field takes focus, and it can do it
      without `visualViewport` emitting anything on the same frame. The old hook
      got this for free by mounting its effect on `writing`; this one runs
      always, so the focus has to be listened for.
    */
    window.addEventListener('focusin', focused)
    window.addEventListener('focusout', blurred)
    window.addEventListener('scroll', schedule, { passive: true })
    vv.addEventListener('resize', hold)
    vv.addEventListener('scroll', hold)
    window.addEventListener('resize', hold)
    window.addEventListener('orientationchange', hold)

    return () => {
      window.removeEventListener('focusin', focused)
      window.removeEventListener('focusout', blurred)
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
