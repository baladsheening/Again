'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Both bars go when the record is being read, and come back when it is not.
 *
 * **The bars are furniture on a page whose product is the record.** Reading back
 * is the one thing the page does where none of the seven controls can act:
 * nothing is picked, and the chrome is a hundred pixels of glass holding glyphs
 * that are all off. So it leaves, and the first flick upward brings it back —
 * which is the browser's own grammar, and the reason it needs no affordance to
 * explain it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Nothing moves that could take a control with it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **`held` is the whole of the safety, and it is a condition removed rather
 * than a case handled.** The foot is the picked line's toolbar; hiding it the
 * instant somebody picks a line would take away the two controls the pick exists
 * to reach. So the chrome does not recede while a line is picked, and it returns
 * the moment one is. There is no state in which a lit control is off screen.
 *
 * ⚠ **A picked line, and not a focused one — the difference was measured.** This
 * held on `focused` for an afternoon, and on the desk that meant it never
 * receded at all: the live line carries `autoFocus`, so the page opened held and
 * stayed held. Worse, it was *unstable* — whether React saw the focus depended
 * on whether the autofocus beat hydration, so the same build receded on some
 * loads and not others. **A hold that means something different on two of the
 * four surfaces is the defect `CLAUDE.md` names**, and focus is exactly that: on
 * iOS it needs a gesture and implies a keyboard, on the desk it is the resting
 * state of the page.
 *
 * What focus was standing in for is a **keyboard**, and that is measured rather
 * than inferred — see `keyboardUp`.
 *
 * ⚠ **It cannot fight `useKeyboardPin`.** That hook writes `transform` to the
 * foot; this is a Tailwind `translate-y`, and in Tailwind v4 those compile to
 * the standalone **`translate`** property. Two properties, composed by the
 * browser in a fixed order, neither able to overwrite the other.
 *
 * ⚠ **Nothing reflows.** The page's top padding and `page-hem` still reserve the
 * full height of both bars, so the record does not move when they leave. A page
 * that reflowed under a thumb mid-scroll would be the same defect the landing
 * blink is written to avoid, and it would be worse here — the reflow would move
 * the very line somebody was reading.
 */

/**
 * How much committed movement in one direction before the chrome answers.
 *
 * **A human constant, not a device one** — it is the slack in a finger, and it
 * is the same slack on all four surfaces, which is the test `CLAUDE.md` sets. It
 * exists because a scroll is not monotonic: momentum wobbles, a thumb resettles,
 * and a bar that flipped on every sign change would be a bar flickering.
 *
 * ⚠ **6px, halved on 24 August**, with the resting floor removed in the same
 * pass. It was 12 against a floor of the foot's own height, which held the
 * chrome for the first 56px of the record and then wanted 12 more — nearly
 * seventy pixels of scrolling before anything happened, which reads as the page
 * ignoring you. Now the only thing between a flick and an answer is the slack.
 */
const STEP = 6

/**
 * **Is a software keyboard up?** Read off the number `useKeyboardPin` already
 * writes, rather than measured again here.
 *
 * ⚠ **One instrument, not two.** The pin computes this every frame a keyboard is
 * arriving — `floorAnchor.bottom − (vv.offsetTop + vv.height)`, the layout
 * viewport's floor against the visual one's — and publishes it as
 * `--keyboard-overlap` because the page needs it for its own hem. A second
 * reading of the same thing here would be free to disagree with the first, which
 * is how a foot ends up pinned by one number and hidden by another.
 *
 * ⚠ **And not a device test.** "Is this a phone" is banned by `CLAUDE.md` and
 * would be wrong anyway — an iPad with a hardware keyboard is a coarse pointer
 * with nothing covering the glass. This asks the only question that matters, and
 * it answers 0 on the desk without being told what a desk is.
 *
 * Reading an inline custom property costs no layout, which is why it is allowed
 * in the frame loop below and `getBoundingClientRect` is not.
 */
function keyboardUp(host: React.RefObject<HTMLElement | null>) {
  return (
    parseFloat(host.current?.style.getPropertyValue('--keyboard-overlap') ?? '') >
    0
  )
}

/**
 * ⚠ **`scrollY` and nothing else, which is what makes this safe to run every
 * frame.** It clamped against `scrollHeight − innerHeight` for a day, to swallow
 * iOS's rubber band at both ends. Two things were wrong with that. It read
 * layout inside a scroll handler, forcing a reflow per frame on the one gesture
 * that cannot afford one — and it built the answer out of `innerHeight`, which
 * `useKeyboardPin` spends forty lines warning is a number that means different
 * things to different browsers, and which *changes mid-scroll* in a Safari tab
 * as the address bar collapses. A clamp whose ceiling moves while you scroll
 * reports movement that did not happen, in the direction that flickers the bars.
 *
 * What is left of it is the top: `scrollY` goes negative there on a bounce, and
 * `Math.max` is arithmetic rather than a measurement. **The bottom no longer
 * needs a clamp at all**, because the end of the record now shows the chrome
 * outright — see `end` — so the bounce down there has nothing left to toggle.
 */
function position() {
  return Math.max(0, window.scrollY)
}

export function useChromeRecede({
  held,
  host,
  end,
}: {
  /** Something on screen can act — which on this page means a line is picked. */
  held: boolean
  /** Where `useKeyboardPin` publishes `--keyboard-overlap` — see `keyboardUp`. */
  host: React.RefObject<HTMLElement | null>
  /**
   * A zero-height marker at the end of the record.
   *
   * **The bars come back when the record runs out**, because there is nothing
   * further to reveal and what a thumb wants at the end of a list is the
   * controls again. It is an `IntersectionObserver` on a rendered box rather
   * than arithmetic on `scrollHeight`: the same argument `useKeyboardPin` makes
   * at length — a rendered box is a fact, and the numbers around it are a model
   * of the browser.
   */
  end: React.RefObject<HTMLElement | null>
}) {
  const [receded, setReceded] = useState(false)
  /** Whether the end of the record is on screen, for the frame loop to consult. */
  const atEnd = useRef(false)

  /**
   * Bring the chrome back now, whatever the scroll said. The page calls it from
   * `pick`, which is the one way into a hold.
   *
   * ⚠ **An event handler, and that is the point.** Two earlier versions
   * synchronised the hold from React instead — one from `useEffect`, which the
   * lint rule rejects as a cascading render, and one adjusted during render,
   * which passed every check and then **failed twice in three runs on a
   * machine**: the bar stayed off the top of the glass with a line picked and
   * its two controls lit under it. A reset that is *sometimes* applied is worse
   * than none, because the state it leaves is the unsafe one.
   *
   * A handler cannot race a render, so this one is simply true. See the probe:
   * `node_modules/.probe/recede-dbg.mjs`.
   */
  const show = useCallback(() => setReceded(false), [])

  /* The end of the record, watched rather than calculated. */
  useEffect(() => {
    const mark = end.current
    if (!mark) return
    const observer = new IntersectionObserver((entries) => {
      const there = entries[0].isIntersecting
      atEnd.current = there
      /* Answer at once: the scroll may already have stopped. */
      if (there) setReceded(false)
    })
    observer.observe(mark)
    return () => observer.disconnect()
  }, [end])

  useEffect(() => {
    /* Nothing to subscribe to while something on screen can act. */
    if (held) return

    let last = position()
    /** Movement since the last change of direction. */
    let carried = 0
    let frame = 0

    const read = () => {
      frame = 0
      const y = position()
      const step = y - last
      last = y

      /*
        The three states with nothing to gain by hiding: the top of the record,
        the end of it, and a keyboard up. The keyboard is checked here rather
        than in `held` because it is a measurement and not a React state —
        nothing re-renders when one arrives.
      */
      if (y <= 0 || atEnd.current || keyboardUp(host)) {
        carried = 0
        setReceded(false)
        return
      }

      /* A change of direction starts the count again rather than eating into it. */
      carried = Math.sign(step) === Math.sign(carried) ? carried + step : step
      if (carried > STEP) setReceded(true)
      else if (carried < -STEP) setReceded(false)
    }

    /*
      One read per frame. `scroll` fires far more often than that on every one of
      the four surfaces, and coalescing is most of what keeps this off the
      critical path — the rest is that `read` no longer touches layout at all.
    */
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [held, host])

  /*
    ⚠ **Derived, not stored** — a hold cannot leave the chrome away even if
    something one day sets `receded` while one is running. `show` keeps the
    stored value honest so releasing a hold has nothing stale to flash; this
    makes it impossible for the stale value to be *seen* in the first place. Two
    cheap guarantees rather than one clever one.
  */
  return { receded: held ? false : receded, show }
}
