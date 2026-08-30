'use client'

import { useRef } from 'react'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Tap thinks, swipe does — 30 August, Phase 2 step 2
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Swipe a line: cross off one way, settle the other.** The two verbs used
 * fifty times a week become directional gestures on the row itself, and the
 * console becomes what it should be — the once-a-week question. **A gesture that
 * can be made anywhere on a row is the only kind of target that survives being
 * used while walking**, which is the whole argument: no console to open, no
 * glyph to hit, nothing to aim at.
 *
 * ⚠ **A tap still opens the console and that is untouched.** The two gestures
 * are on the same row and cannot be confused, because one of them has no
 * distance in it. See `onClickCapture` below for the one line that keeps them
 * apart.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The scroll question, answered by the browser rather than by a thermostat
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **`touch-action: pan-y` on the row is the whole of it**, and it is declared
 * in `page-row` rather than computed here. It tells the engine: vertical panning
 * is yours, horizontal is mine. So the browser arbitrates the axis with its own
 * gesture recogniser — the one that already knows what a scroll feels like on
 * that platform — and **we never guess.** When it decides the gesture is a
 * scroll it sends `pointercancel`, which is the signal to let go.
 *
 * The design brief asked for this to be checked rather than assumed: *check that
 * a horizontal swipe on a row cannot be read as a scroll.* It cannot, because the
 * two are separated by a standard property before either of them reaches this
 * file. A hand-written axis lock would be the thermostat `keyboard-hem.ts` needed
 * five versions to get right, rebuilt on a second axis.
 *
 * ⚠ **The small activation below is for a POINTER, not for touch.** A mouse has
 * no `touch-action` arbitration, so a click that drifts two pixels would arm a
 * swipe. Six pixels and a dominant axis is what separates a drag from a click on
 * a desk; on a handset the browser has already decided by the time it matters.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The row travels its own height, and stops
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **The threshold is the row's own height, read off the row.** Not a token, not
 * a fraction, not a number tuned until one device felt right: a row of the record
 * is `--tap-floor` tall on a handset by design and four-thirds of that on the
 * desk, so **measuring the thing being swiped gets both surfaces right by
 * derivation** and follows the density if it ever changes.
 *
 * ⚠ **It clamps there, which makes it a DETENT rather than a threshold you have
 * to guess at.** The row tracks the finger, stops dead when the action is armed,
 * and stays stopped however much further you push. There is no glyph and no
 * colour to say *this is far enough* — §11 spends colour on overlap and chrome
 * and nothing else — so the row stopping is the signal, and it is one a hand can
 * feel without looking, which is the point of the whole gesture.
 *
 * ⚠ **iOS HAS NO HAPTICS, so the visual response is the mechanism and not a
 * nicety.** Safari implements no Vibration API on any version — see
 * `lib/haptics.ts` — and the installed app is a handset. A swipe designed to be
 * confirmed by the hand would be confirmed by nothing at all on the one surface
 * this app is used on. So both outcomes are self-evident *after* the fact as
 * well: crossing off strikes the line where it stands, and settling puts a
 * question on it. Neither is destructive and neither needs an undo.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why settling ASKS instead of settling
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **A swipe cannot settle a line, because settling has two answers.** *I would
 * do this again* and *that is dealt with* are genuinely different claims — it is
 * the app's own name on one of them — and one direction cannot carry both. So
 * the settle swipe puts *Again?* on the row and the two answers are a tap each,
 * which is exactly what the console's settle glyph does through a longer door.
 *
 * **It is still much cheaper than the console**: one swipe and one tap, against a
 * tap, a read, a glyph and a tap. And it has the safety the console has — nothing
 * leaves the page until somebody answers, so a swipe made by accident costs a
 * question rather than a row.
 *
 * ⚠ **Crossing off needs no question and gets none.** It is a toggle: the row
 * stays where it is, struck through, and the same swipe puts it back. That
 * asymmetry is not an inconsistency — it is the difference between a resolution
 * with two meanings and one with an inverse.
 */

/** Which way, in the reading direction of a left-to-right page. */
export type SwipeWay = 'settle' | 'crossOff'

/**
 * ⚠ **Physical, not logical, and the RTL question is open.** Rightward settles
 * and leftward crosses off, which is the direction every list on every phone
 * already teaches: away from you completes, back toward you removes. It is
 * written against the screen rather than against the writing direction, so on an
 * Arabic page the gestures do not mirror.
 *
 * **That is a deliberate hold rather than an oversight.** The field mirrors
 * because `dir="auto"` reads the first strong character somebody typed; a *row*
 * has no such signal, and a record can hold both languages at once — so mirroring
 * per row would mean two rows on one screen answering the same swipe differently,
 * which is worse than not mirroring at all. Revisit it when there is somebody
 * reading the record right-to-left to ask.
 */
const RIGHT: SwipeWay = 'settle'
const LEFT: SwipeWay = 'crossOff'

/** A pointer that has moved this far on the dominant axis is dragging. */
const ACTIVATION = 6

export function useRowSwipe() {
  const live = useRef<{
    id: number
    el: HTMLElement
    x0: number
    y0: number
    /** Null until the axis is settled; false means the browser took it. */
    swiping: boolean | null
    /** How far the row actually travelled, for the commit decision. */
    reached: number
  } | null>(null)

  /**
   * ⚠ **Set on release and read by the click that follows it.** A swipe that
   * begins on the words ends in a `click` on that span, which would open a
   * console for a line somebody just crossed off. This is the one line that
   * keeps *tap* and *swipe* apart, and it is a ref rather than state because it
   * is read inside the same tick it is written.
   */
  const swiped = useRef(false)

  /**
   * ⚠ **The transform is written through CSSOM, not through React.** A
   * `pointermove` fires at the frame rate, and putting `dx` in state would
   * re-render fifty rows of the record for every one of them. It cannot be an
   * inline `style` attribute either — the production CSP blocks those (§10) —
   * so this is the same door `useKeyboardHem` uses to write
   * `--keyboard-overlap`, for the same two reasons.
   */
  function draw(el: HTMLElement, dx: number, settling: boolean) {
    el.style.transition = settling ? 'transform var(--recede) var(--ease-recede)' : 'none'
    el.style.transform = dx === 0 ? '' : `translateX(${dx}px)`
  }

  return function bind(act: (way: SwipeWay) => void) {
    return {
      onPointerDown(e: React.PointerEvent<HTMLElement>) {
        /* A second finger, or a pointer already tracked: leave it alone. */
        if (live.current) return
        live.current = {
          id: e.pointerId,
          el: e.currentTarget,
          x0: e.clientX,
          y0: e.clientY,
          swiping: null,
          reached: 0,
        }
        swiped.current = false
      },

      onPointerMove(e: React.PointerEvent<HTMLElement>) {
        const s = live.current
        if (!s || s.id !== e.pointerId || s.swiping === false) return

        const dx = e.clientX - s.x0
        const dy = e.clientY - s.y0

        if (s.swiping === null) {
          /*
            ⚠ **Vertical dominance releases the gesture rather than fighting for
            it.** On touch the browser has usually decided already and will send
            `pointercancel`; this is what makes a mouse behave the same way.
          */
          if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > ACTIVATION) {
            s.swiping = false
            return
          }
          if (Math.abs(dx) < ACTIVATION || Math.abs(dx) <= Math.abs(dy)) return
          s.swiping = true
          /* Keep the moves coming once the finger leaves the row's own box. */
          s.el.setPointerCapture(e.pointerId)
        }

        /*
          ⚠ **The row's own height is the travel and the threshold at once.** See
          the note at the head of this file: measuring the thing being swiped is
          what makes a handset and a desk right by derivation rather than by two
          numbers agreeing.
        */
        const stop = s.el.getBoundingClientRect().height
        s.reached = dx
        draw(s.el, Math.max(-stop, Math.min(stop, dx)), false)
      },

      onPointerUp(e: React.PointerEvent<HTMLElement>) {
        const s = live.current
        if (!s || s.id !== e.pointerId) return
        live.current = null
        if (s.swiping !== true) return

        swiped.current = true
        const stop = s.el.getBoundingClientRect().height
        draw(s.el, 0, true)
        /*
          ⚠ **Both outcomes end with the row back where it was**, because neither
          of them moves it: crossing off strikes it in place and settling puts a
          question under it. A row left held open would be a fourth state to
          dismiss, and this page has one dismissal gesture already.
        */
        if (Math.abs(s.reached) >= stop) act(s.reached > 0 ? RIGHT : LEFT)
      },

      /**
       * ⚠ **The browser taking the gesture is not a failure, it is the answer.**
       * `pointercancel` is what a scroll looks like from in here, and letting go
       * without argument is the whole reason there is no axis thermostat.
       */
      onPointerCancel(e: React.PointerEvent<HTMLElement>) {
        const s = live.current
        if (!s || s.id !== e.pointerId) return
        live.current = null
        draw(s.el, 0, true)
      },

      onClickCapture(e: React.MouseEvent<HTMLElement>) {
        if (!swiped.current) return
        swiped.current = false
        /* Capture phase, so the words' own `onClick` never runs. */
        e.stopPropagation()
        e.preventDefault()
      },
    }
  }
}
