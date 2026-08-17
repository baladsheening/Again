/**
 * A light haptic on the tap that adds something.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  One line, and it is Android's — 17 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Call it synchronously inside the handler for the tap.** Not after an `await`,
 * not from an effect, not when the server answers: a haptic answers a finger, and
 * every platform that has one grants it for a live gesture and refuses it
 * afterwards. `film-screen.tsx` calls this as the first statement in `add` and in
 * `undo`.
 *
 * 10ms is the conventional light tap. Anything longer is a buzz, and a buzz for an
 * add is the phone asking to be noticed rather than answering.
 *
 * ⚠ **iOS gets nothing, and there is no longer any code here pretending
 * otherwise.** Safari implements no Vibration API on any version — not behind a
 * prefix, not behind a permission — and the one known workaround was built,
 * shipped, revised and felt by nobody. The account is in `docs/decisions.md`,
 * *Haptics: wanted, and not possible on iOS today*, and **the want is still open
 * in `docs/plan.md`** rather than closed by this deletion.
 *
 * Optional call rather than a branch: this is a feature test on a standard API,
 * so the day Safari implements it this file needs no edit at all.
 */
export function haptic() {
  navigator.vibrate?.(10)
}
