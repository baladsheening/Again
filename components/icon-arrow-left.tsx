/**
 * The way out of search, at the left of the field in the masthead.
 *
 * ⚠ **An arrow with a shaft, not a mirrored `ChevronIcon`** — and that is the
 * whole reason this file exists rather than a `rotate-180` class. The chevron is
 * a marker meaning *goes to*, and it is sitting two glyphs away pointing the
 * other way at the field. Two chevrons back to back read as a pair, or as one
 * control that has broken; a shaft says "leave" where a bare wedge says
 * "onward".
 *
 * **12px and a 12px viewBox, matching `ChevronIcon`** — directed, so the two
 * agree at a glance. It carries `tap-target` at its call site, which takes the
 * hit area to 44px without moving anything.
 *
 * Same inline-rather-than-a-package reasoning as the other icons, and
 * `currentColor` for the same reason: §11 reserves amber for overlap, so this
 * inherits the muted/hover treatment of the button around it.
 */
export function ArrowLeftIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M9.75 6h-7.5" />
      <path d="M5.5 2.75 2.25 6l3.25 3.25" />
    </svg>
  )
}
