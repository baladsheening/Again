'use client'

import { useEffect, useState } from 'react'

/**
 * Both bars go when the record is being read, and come back at either end of it.
 *
 * **The bars are furniture on a page whose product is the record.** Reading back
 * is the one thing the page does where none of the seven controls can act:
 * nothing is picked, and the chrome is a hundred pixels of glass holding glyphs
 * that are all off. So it leaves, and it is there again wherever the record
 * stops — the top, the end, or a line picked.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  There is no scroll handler here, and that is the fix
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Two versions of this watched the scroll direction, and both were reported
 * flickering on a handset**: the bars receding, returning, receding again, over
 * and over until the scroll came to a halt. The second version was the first
 * with a smaller threshold and a cheaper reading, and it changed nothing — which
 * is the evidence that mattered. **The threshold was never the problem. The
 * signal was.**
 *
 * `window.scrollY` is not a description of what the reader can see. In a Safari
 * tab the address bar collapses as you scroll, the layout viewport grows under
 * the content, and the number moves *backwards* while the page is still going
 * down. To a direction detector that is a flick upward, so the chrome comes
 * back; the next frames are downward again, so it leaves. Repeat for as long as
 * the momentum lasts. No threshold survives that, because the false movement is
 * as large as the real movement — and a threshold big enough to swallow it would
 * be a number tuned to outlast one platform's animation, which `CLAUDE.md` rules
 * out by name.
 *
 * So direction detection is gone. **Where you are is a fact; which way you are
 * going was a guess about a moving number.** Two `IntersectionObserver`s on two
 * zero-height marks — the top of the document and the end of the record — and
 * the chrome is present when either is on screen. Crossing an edge is a thing
 * that happens once per gesture, so there is nothing left that can oscillate.
 * `CLAUDE.md` asks for the mechanism to be removed before the condition and the
 * condition before the correction; this is the mechanism.
 *
 * It also costs nothing: no `scroll` listener, no frame loop, no
 * `getBoundingClientRect`, no reading of `innerHeight` or `scrollHeight`. The
 * one gesture the page cannot afford to drop frames during now has no JavaScript
 * on it at all.
 *
 * ⚠ **What it trades is the flick back.** A scroll upward in the middle of the
 * record no longer returns the bars; reaching either end does, and so does
 * tapping. That is not a loss of reach — **tapping the paper scrolls to the
 * caret**, which is the top, and **tapping a line picks it**, which holds the
 * chrome down by `held`. Both were already the page's two gestures.
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
 * stayed held. It was *unstable* too, because whether React saw the focus
 * depended on whether the autofocus beat hydration. **A hold that means
 * something different on two of the four surfaces is the defect `CLAUDE.md`
 * names.**
 *
 * The keyboard it was standing in for needs no clause of its own any more.
 * Everything that raises one goes through `write`, which scrolls to the caret
 * first — and the caret is at the top, where the chrome is present by this
 * hook's own rule.
 *
 * ⚠ **Nothing else moves the foot any more.** `useKeyboardPin` used to lift it
 * onto the keyboard's top edge; that is deleted — see `keyboard-hem.ts` — so
 * this hook's `translate` is the only writer. **Do not add a second one.**
 *
 * ⚠ **Nothing reflows.** The page's top padding and `page-hem` still reserve the
 * full height of both bars, so the record does not move when they leave. A page
 * that reflowed under a thumb mid-scroll would be the same defect the landing
 * blink is written to avoid, and worse — the reflow would move the very line
 * being read.
 */

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
) {
  const [seen, setSeen] = useState(initial)

  useEffect(() => {
    const el = mark.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) =>
      setSeen(entry.isIntersecting),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mark])

  return seen
}

export function useChromeRecede({
  held,
  top,
  end,
}: {
  /** Something on screen can act — which on this page means a line is picked. */
  held: boolean
  /**
   * A mark at the very top of the document.
   *
   * **On screen means the record has not been scrolled**, and the chrome stays.
   * It is the first thing in the document rather than the first thing under the
   * bar, so the bars answer the first pixel of a scroll — which is the least
   * travel there is, and what was asked for twice.
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
  /* Shown on arrival: the page opens at the top, which is this mark's own state. */
  const atTop = useOnScreen(top, true)
  const atEnd = useOnScreen(end, false)

  return !held && !atTop && !atEnd
}
