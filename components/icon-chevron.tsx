/**
 * The marker on the mode switches under the sign-in form. Those used to be
 * underlined; the chevron carries the affordance instead, which is quieter and
 * does not put a rule under three lines of 12px text.
 *
 * It points right and sits on the left, so it reads as a marker on something that
 * leads somewhere rather than as a back arrow. §11 permits known icons and this is
 * the known one for "goes to".
 *
 * 12px against a 16px line box, so a row of these is still 16px tall — the
 * sign-in page's centring is derived from that height (docs/decisions.md). Same
 * inline-rather-than-a-package reasoning as `icon-eye.tsx`, and `currentColor` for
 * the same reason: it inherits the muted/hover treatment of the button around it,
 * and §11 reserves amber for overlap.
 */
/**
 * ⚠ **`size` defaults to the 12 the sign-in switches are measured against**, and
 * the film screen's handle passes 16 — asked for on 18 August, and it is a grab
 * handle on a full-width band rather than a marker beside 12px text. Passed
 * rather than defaulted up, because the sign-in page's centring is derived from
 * this being 12 against a 16px line box.
 */
export function ChevronIcon({
  className = '',
  size = 12,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M4.25 2.5 7.75 6l-3.5 3.5" />
    </svg>
  )
}
