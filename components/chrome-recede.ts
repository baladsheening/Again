'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Both bars go when the record is being read, and come back when it is not.
 *
 * **The bars are furniture on a page whose product is the record.** Reading back
 * is the one thing the page does where none of the seven controls can act:
 * nothing is picked, no keyboard is up, and the chrome is 104px of black holding
 * glyphs that are all off. So it leaves, and the first flick upward brings it
 * back — which is the browser's own grammar, and the reason it needs no
 * affordance to explain it.
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
 * receded at all: the live line takes focus on arrival there, so the page opened
 * held and stayed held. Worse, it was *unstable* — whether React saw the focus
 * depended on whether the autofocus beat hydration, so the same build receded on
 * some loads and not others. **A hold that means something different on two of
 * the four surfaces is the defect `CLAUDE.md` names**, and focus is exactly
 * that: on iOS it needs a gesture and implies a keyboard, on the desk it is the
 * resting state of the page.
 *
 * What focus was standing in for is a **keyboard**, and that is measured rather
 * than inferred — see `keyboardUp`. While one is up every control in the foot
 * is off anyway, so what the check protects is not a control: it is the foot
 * itself, which `useKeyboardPin` is holding on the keyboard's top edge at the
 * same time.
 *
 * ⚠ **The ten-second undo window deliberately does not hold it.** Scrolling down
 * through the record is the reading gesture, and undo is not what a thumb is
 * reaching for while it does that; the bar is one flick away for the whole
 * window either way. Holding on it would mean the chrome never recedes during a
 * run of captures, which is exactly when the record is worth seeing.
 *
 * ⚠ **It cannot fight `useKeyboardPin`, by construction and not by agreement.**
 * That hook writes `transform` to the foot every frame while the keyboard is up;
 * this one is a Tailwind `translate-y` utility, and in Tailwind v4 those compile
 * to the standalone **`translate`** property. Two properties, composed by the
 * browser in a fixed order — so even if both were ever live at once, neither can
 * overwrite the other. `held` already rules that out; this is why it does not
 * matter if it stops.
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
 * and a bar that flips on every sign change is a bar flickering.
 */
const STEP = 12

/**
 * The bars stay while the page is scrolled by less than the foot's own height.
 *
 * **Measured off the foot rather than chosen**, so it is one bar's worth of
 * record: until that much has gone past, receding reveals less page than it
 * costs in furniture that has to come back.
 */
function floorOf(foot: React.RefObject<HTMLElement | null>) {
  return foot.current?.getBoundingClientRect().height ?? 0
}

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
 */
function keyboardUp(host: React.RefObject<HTMLElement | null>) {
  return (
    parseFloat(host.current?.style.getPropertyValue('--keyboard-overlap') ?? '') > 0
  )
}

/**
 * ⚠ **Clamped, which is what makes it survive iOS.** `scrollY` goes negative at
 * the top of a rubber-banded document and past the maximum at the bottom, and
 * both are *movement in a direction* to a naive reader — so the chrome flickers
 * on every bounce, on exactly one of the four surfaces. Clamping removes the
 * range the bounce lives in, so the bounce produces no delta at all. That is the
 * condition gone rather than a threshold tuned to outlast it.
 */
function position() {
  const max = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  )
  return Math.max(0, Math.min(window.scrollY, max))
}

export function useChromeRecede({
  held,
  foot,
  host,
}: {
  /** Something on screen can act — which on this page means a line is picked. */
  held: boolean
  /** The foot, read for its height — see `floorOf`. */
  foot: React.RefObject<HTMLElement | null>
  /** Where `useKeyboardPin` publishes `--keyboard-overlap` — see `keyboardUp`. */
  host: React.RefObject<HTMLElement | null>
}) {
  const [receded, setReceded] = useState(false)

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
        The keyboard is checked here rather than in `held` because it is a
        measurement and not a React state: nothing re-renders when a keyboard
        arrives, and every path that raises one scrolls to the caret first, so
        this frame is the one that would otherwise take the foot away.
      */
      if (y <= floorOf(foot) || keyboardUp(host)) {
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
      the four surfaces, and this reads layout — so an unthrottled listener is a
      forced reflow per event on the one gesture the page cannot afford to drop
      frames during.
    */
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [held, foot, host])

  /*
    ⚠ **Derived, not stored** — a hold cannot leave the chrome away even if
    something one day sets `receded` while one is running. `show` keeps the
    stored value honest so releasing a hold has nothing stale to flash; this
    makes it impossible for the stale value to be *seen* in the first place. Two
    cheap guarantees rather than one clever one.
  */
  return { receded: held ? false : receded, show }
}
