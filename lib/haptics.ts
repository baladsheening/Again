/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The haptic vocabulary — one rule, and it is about the database
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * > **Every haptic corresponds to something that just became true in the
 * > database. Never to a UI transition.**
 *
 * Otherwise the hand learns noise and stops reading it. So opening the console,
 * dismissing it, the keyboard rising and the chrome receding are all **silent**:
 * those are things the person did, not things that happened.
 *
 * ⚠ **Three patterns, and they have to be TELLABLE APART or they are worse than
 * none.** A capture landing and a line being crossed off are different facts; the
 * same 10ms buzz for both is exactly the noise the rule above exists to prevent.
 * That is why this file grew from one function to three rather than gaining a
 * second caller for the one it had.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Call it synchronously inside the handler — 17 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Not after an `await`, not from an effect, not when the server answers.** A
 * haptic answers a finger, and every platform that has one grants it for a live
 * gesture and refuses it afterwards.
 *
 * ⚠ **That sits slightly awkwardly beside the rule at the top and the rule wins
 * where they meet.** Every write on this page is optimistic — the line is on the
 * page before the save goes out — so *became true* means *became true on the
 * record*, which is the thing the person is looking at. A haptic that waited for
 * the network would arrive after the hand had moved on, and a failure puts a
 * message on the line rather than taking the buzz back.
 *
 * ⚠⚠ **iOS GETS NOTHING, AND THE INSTALLED APP IS A HANDSET.** Safari implements
 * no Vibration API on any version — not behind a prefix, not behind a permission
 * — and the one known workaround was built, shipped, revised and felt by nobody.
 * The account is in `docs/decisions.md`, *Haptics: wanted, and not possible on
 * iOS today*.
 *
 * **So nothing may be designed to be confirmed by the hand alone.** The swipes
 * are the case in point: they are meant to be usable without looking, and on the
 * one surface this app actually runs on they would be confirmed by nothing at
 * all. What confirms them is the row travelling its own height and stopping, and
 * the outcome being visible where it happened. See `row-swipe.ts`.
 *
 * Optional call rather than a branch: this is a feature test on a standard API,
 * so the day Safari implements it this file needs no edit.
 */

/**
 * **A capture landed.** One light tap — 10ms is the conventional one.
 *
 * ⚠ **It has a second caller since 30 August and there is still no fourth
 * pattern.** Putting a crossed-off line back fires this rather than a signal of
 * its own: *a line is on the live record* is the fact both callers state, and
 * the rule at the top of this file is about facts rather than about which
 * gesture caused one. A fourth buzz would have to be tellable from three others
 * on the one axis `vibrate()` controls, and it would be saying something the
 * page already says by un-striking the words.
 */
export function haptic() {
  navigator.vibrate?.(10)
}

/**
 * **A line was settled.** A firmer double.
 *
 * Two pulses, because settling is the one resolution that takes the line off the
 * page — the only fact on this record that changes *where a thing is* rather than
 * what it says. The gap is short enough to read as one event with two beats
 * rather than as two events.
 */
export function hapticSettled() {
  navigator.vibrate?.([14, 40, 14])
}

/**
 * **A line was crossed off.** One heavier thud.
 *
 * Longer than the capture's tap and single where settling is double, so the three
 * are separable by length and by count rather than by intensity — which is the
 * only axis a `vibrate()` duration actually controls.
 */
export function hapticCrossedOff() {
  navigator.vibrate?.(26)
}
