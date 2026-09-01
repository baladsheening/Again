'use client'

import { useEffect, useState } from 'react'

/**
 * Both bars go when the record is being read, and come back at either end of it
 * or on a flick upward.
 *
 * **The bars are furniture on a page whose product is the record.** Reading back
 * is the one thing the page does where none of the seven controls can act:
 * nothing is picked, and the chrome is glass holding glyphs that are all off. So
 * it leaves — and the live band stays, because that one can always act.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The flick came back, and this time it reads the record rather than the page
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Two versions of this watched the scroll direction and both were reported
 * flickering on a handset** — the bars receding, returning, receding again,
 * until the scroll came to a halt. Direction detection was then removed
 * entirely, and asked for again, so it is back on a different signal. The
 * distinction is the whole of this file:
 *
 * **What made it flicker was never the threshold.** It was `window.scrollY`, and
 * it was `--keyboard-overlap`. Neither describes what a reader can see. In a
 * Safari tab the address bar collapses as you scroll: the layout viewport grows
 * under the content, `scrollY` moves *backwards* while the page is still going
 * down, and the gap `--keyboard-overlap` measures opens and closes for the
 * length of the animation. A direction detector reads both as a flick upward, so
 * the chrome comes back; the next frames are downward again, so it leaves.
 * Repeat until the momentum stops. No threshold survives that, because the false
 * movement is as large as the real movement.
 *
 * **So the signal is a rendered box.** `top` is a mark in the document's own
 * flow, and its position on the glass is what the reader actually sees move: it
 * does not care what the browser is doing with viewport units, address bars or
 * keyboards. That is the old keyboard pin's lesson — *it measures, it does not
 * calculate* — applied to the one number this hook needs.
 *
 * ⚠ **And the retracement is measured from the extremum, not from the last
 * frame.** A wobble of a few pixels inside a descent counts against the furthest
 * point reached rather than resetting a running total, so it takes a real pull
 * back to turn the chrome around. That is hysteresis, not a bigger number.
 *
 * ⚠ **`--keyboard-overlap` is not consulted, and must not be.** It is honest
 * about what it measures and it is not a keyboard detector — see
 * `keyboard-hem.ts`. There is deliberately no `keyboardUp` helper in the tree.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Nothing moves that could take a control with it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **`held` is the whole of the safety, and it is a condition removed rather
 * than a case handled.** The foot is the picked line's toolbar; hiding it the
 * instant somebody picks a line would take away the two controls the pick exists
 * to reach. It is derived rather than stored, so no ordering, no race, and no
 * state in which a lit control is off screen.
 *
 * ⚠ **A picked line, and not a focused one — the difference was measured.** This
 * held on `focused` for an afternoon, and on the desk that meant it never
 * receded at all: the live line carries `autoFocus`, so the page opened held and
 * stayed held. It was unstable too, because whether React saw the focus depended
 * on whether the autofocus beat hydration. **A hold that means something
 * different on two of the four surfaces is the defect `CLAUDE.md` names.**
 *
 * ⚠ **Nothing moves the foot but this.** The keyboard pin used to lift it onto
 * the keyboard's top edge; that is deleted, so this hook's `translate` is the
 * only writer on that element. **Do not add a second one.**
 *
 * ⚠ **Nothing reflows.** The page's top padding and `page-hem` still reserve the
 * full height of both bars, so the record does not move when they leave.
 */

/**
 * How far the record has to travel before the bars answer — **in either
 * direction, since 1 September.**
 *
 * **A gesture, not a device measurement** — the same pull on all four surfaces,
 * which is the test `CLAUDE.md` sets. Big enough that settling a thumb is not a
 * request, small enough that one flick is.
 *
 * ⚠⚠ **IT USED TO GOVERN THE RETURN ALONE, AND THE BARS LEFT ON THE FIRST
 * PIXEL.** That was deliberate — *the least travel there is, which is what was
 * asked for* — and it was reported back as **too eager**. One pixel is not
 * evidence that anybody is reading; a thumb resting on a moving list produces
 * it, and so does the tail of a momentum scroll.
 *
 * ⚠ **So the machine is symmetric and there is still exactly one number.** The
 * chrome answers a pull, and it is the same pull whichever way it goes: 40px
 * down and it leaves, 40px back and it returns. **Do not give the two
 * directions separate constants** — that is the split `--recede` was collapsed
 * to avoid, and it would need a hardware reason stated in the token.
 *
 * ⚠ **This number is not what went wrong twice.** The signal was; see the head
 * of this file. Changing it is a matter of feel and nothing else, and it can be
 * changed without any of that argument being reopened.
 */
const FLICK = 40

/**
 * Watch one zero-height mark, and say whether it is on screen.
 *
 * ⚠ **Zero height is deliberate and it does intersect.** A mark with no area
 * reports `isIntersecting` on its rect alone, which is what makes it free: it
 * can sit at the top of the document and at the end of the record without
 * occupying either.
 */
function useOnScreen(
  mark: React.RefObject<HTMLElement | null>,
  initial: boolean,
  paused: boolean,
) {
  const [seen, setSeen] = useState(initial)

  useEffect(() => {
    const el = mark.current
    /*
      Paused means disconnected, which means the last answer stands. That is
      what freezes the chrome while somebody is writing — see `writing`.
    */
    if (!el || paused) return
    const observer = new IntersectionObserver(([entry]) =>
      setSeen(entry.isIntersecting),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mark, paused])

  return seen
}

export function useChromeRecede({
  held,
  writing,
  top,
  end,
}: {
  /** Something on screen can act — which on this page means a line is picked. */
  held: boolean
  /**
   * The live line has focus.
   *
   * **The chrome freezes where it stands.** Somebody who scrolled down the
   * record and then tapped the live line asked for a keyboard, not for the bars
   * back — and somebody who was at the top and tapped it should not lose them.
   * Both are one rule: *writing does not move the furniture.*
   *
   * ⚠ **It freezes by disconnecting, not by latching.** The two observers stop
   * observing and the flick loop stops listening, so every input this hook reads
   * keeps the value it had; there is no copy of the answer to go stale, and
   * nothing to synchronise on the way in or out. `held` cannot move either —
   * focus clears the pick.
   *
   * ⚠ It is also true that the record cannot scroll while this is on, because
   * the writing pane takes the touch. **Do not rely on that here.** One of those
   * is a layout decision and this is a guarantee, and the guarantee should stand
   * on its own.
   */
  writing: boolean
  /**
   * A mark at the very top of the document, and this hook's only instrument.
   *
   * **On screen means the record has not been scrolled**, and the chrome stays.
   * It is the first thing in the document rather than the first thing under the
   * bar, so what it measures is the record's own travel from the very top.
   *
   * ⚠ **That placement used to be the whole recede trigger, and is not any
   * more.** The note here read *so the bars answer the first pixel of a scroll —
   * the least travel there is, which is what was asked for*, and the first pixel
   * was reported back as too eager. Leaving now costs a pull of `FLICK`, like
   * returning. **The mark stays exactly where it is**: its job was always two
   * jobs, and the one that survives is the measurement.
   *
   * **Its distance above the glass is also the scroll position**, measured off a
   * rendered box instead of taken from `window.scrollY`. That is what the flick
   * detector reads, and why it cannot be lied to by an address bar.
   */
  top: React.RefObject<HTMLElement | null>
  /**
   * A mark after the last line.
   *
   * **The bars come back when the record runs out**, because there is nothing
   * further to reveal and what a thumb wants at the end of a list is the
   * controls again.
   */
  end: React.RefObject<HTMLElement | null>
}) {
  /*
    Shown on arrival: the page opens at the top, which is this mark's own state.

    ⚠ **That is an assumption, and it is only true of a document that opens at
    the top — 30 August.** A load that restores a scroll position does not: the
    bars arrive in the server's HTML, paint for the length of hydration, and then
    play the recede. Measured at 260px of visible bar and a 340ms slide by
    `node_modules/.probe/resumechrome.mjs`, on the one path that could reach it —
    the resume re-entry in `page-screen.tsx`, which **no longer fires while the
    page is scrolled**, for exactly this reason.

    ⚠ **Do not answer this with an initial measurement here.** It would be a
    correction for a condition that has been removed, and it could not work
    anyway: the server HTML is painted before any effect of ours runs, so the
    bars are on the glass whatever this value says. What is left reachable is a
    manual reload of a scrolled tab, where the browser's own restore is the
    thing being seen.
  */
  const atTop = useOnScreen(top, true, writing)
  const atEnd = useOnScreen(end, false, writing)
  /**
   * Whether the chrome is currently asked for.
   *
   * ⚠ **It starts TRUE, and that one word is the whole of *too eager*.** It was
   * `recalled`, starting false, meaning *asked back by a flick* — so leaving the
   * top was enough to hide the bars and only their return cost a pull. Now the
   * state means *wanted*, arrival grants it, and it takes a pull of `FLICK`
   * either way to change it. Same machine, same constant, opposite initial
   * value.
   */
  const [wanted, setWanted] = useState(true)

  useEffect(() => {
    const mark = top.current
    /* Writing does not move the furniture — see `writing`. */
    if (!mark || writing) return

    /** How far the record has travelled up the glass. A fact, not a viewport. */
    const travel = () => -mark.getBoundingClientRect().top

    /** The furthest point reached in the direction that currently governs. */
    let extreme = travel()
    /** A local mirror, so a frame never has to wait for a render to know. */
    let shown = true
    let frame = 0

    const read = () => {
      frame = 0
      const y = travel()

      /*
        The top is not a flick, it is arrival — and it resets the machine to
        *wanted*, so that a reader who scrolls back up to the beginning and sets
        off again gets the same pull's worth of chrome the first descent had.

        ⚠ **It used to reset to hidden**, which is what made leaving the top cost
        nothing at all. See `FLICK`.
      */
      if (y <= 0) {
        extreme = 0
        if (!shown) {
          shown = true
          setWanted(true)
        }
        return
      }

      if (shown) {
        /* Watching for a push down of a whole pull before the chrome goes. */
        if (y < extreme) extreme = y
        else if (y - extreme > FLICK) {
          extreme = y
          shown = false
          setWanted(false)
        }
      } else {
        if (y > extreme) extreme = y
        else if (extreme - y > FLICK) {
          extreme = y
          shown = true
          setWanted(true)
        }
      }
    }

    /*
      One read per frame. `scroll` fires far more often than that on every one of
      the four surfaces, and this reads layout — so coalescing is what keeps a
      single `getBoundingClientRect` off the critical path instead of one per
      event.
    */
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [top, writing])

  return !held && !atTop && !atEnd && !wanted
}
