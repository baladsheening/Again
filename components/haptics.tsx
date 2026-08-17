'use client'

/**
 * A light haptic on the tap that adds something.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two mechanisms, because no single one covers the two engines that matter
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `navigator.vibrate` is the standard, and **iOS Safari does not implement it on
 * any version** — not behind a prefix, not behind a permission. It is Android's
 * path and nothing else's.
 *
 * ⚠ **The iOS path is a checkbox, and it is folklore rather than an API.** Safari
 * 17.4 added the `switch` attribute for checkboxes, and toggling one through its
 * label plays the system's own light haptic. There is no specification saying it
 * must, no way to feature-detect it, and nothing to stop a future Safari making
 * it silent. It is here because the alternative is no haptic at all on the one
 * surface this was asked from.
 *
 * ⚠ **It only fires inside a live user gesture, which is why this is called on
 * the tap rather than on the confirmation.** The first version fired
 * `navigator.vibrate` when the server returned the entry id; iOS would refuse
 * that even if it had the API, because by then the gesture is over. The
 * confirmation is the tick — that part does not depend on any of this.
 *
 * **Neither call is branched on a browser.** `vibrate` is feature-detected on the
 * standard API, and the switch is clicked unconditionally: on an engine without
 * the behaviour it toggles a hidden checkbox nobody can see or reach, which costs
 * nothing and cannot be wrong. That is the difference between this and sniffing —
 * every surface runs the same two lines.
 */

const SWITCH_ID = 'haptic-switch'

/**
 * The hidden pair the iOS path needs, mounted once for the app.
 *
 * ⚠ **`sr-only`, not `hidden` or `opacity-0` on a `fixed` box.** The element has
 * to be laid out for the click to reach it; a `display: none` control is not
 * clickable and takes the haptic with it. `sr-only` clips it to a pixel and
 * leaves it in the layout.
 *
 * `aria-hidden` and `tabIndex={-1}` because it is a mechanism, not a control:
 * nothing should be able to reach it with a keyboard, and no screen reader should
 * announce a switch that changes nothing.
 */
export function HapticSwitch() {
  /*
    `switch` is not in React's `input` types — it postdates them — and this is a
    plain attribute rather than a `style`, so the CSP note on `wordmark-trim` does
    not apply. Spread rather than a `@ts-expect-error`, which would start failing
    the day React adds the attribute.
  */
  const attrs = { switch: '' } as Record<string, string>

  return (
    <>
      <label htmlFor={SWITCH_ID} className="sr-only" aria-hidden="true" />
      <input
        {...attrs}
        id={SWITCH_ID}
        type="checkbox"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={() => {}}
      />
    </>
  )
}

/**
 * Fire it. **Call this synchronously inside the handler for the tap** — anything
 * later is outside the gesture and iOS will ignore it.
 */
export function haptic() {
  // Android and anything else that implements the standard. 10ms is the
  // conventional light tap; longer is a buzz, and a buzz for an add is the phone
  // asking to be noticed rather than answering.
  navigator.vibrate?.(10)

  // iOS. The label rather than the input: clicking the label is what the
  // behaviour is attached to.
  const label = document.querySelector(`label[for="${SWITCH_ID}"]`)
  if (label instanceof HTMLLabelElement) label.click()
}
