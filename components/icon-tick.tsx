/**
 * Marks a want that has been satisfied, in the live list only.
 *
 * The live view mixes wants with go-back-tos (§5.2). Once the want label came
 * off resolved rows and the return count moved to its own collection, nothing
 * distinguished a film you had watched from one you had not — same title, same
 * year, same everything. Position carries most of that now (satisfied rows sink
 * below unsatisfied ones), and this confirms it at the row.
 *
 * §11 permits known icons, and a tick is the known one for "done with". Same
 * inline-rather-than-a-package reasoning as `icon-chevron.tsx`, and
 * `currentColor` for the same reason: amber is reserved for overlap, so this
 * inherits the muted treatment around it.
 */
/**
 * ⚠ **`size` exists for the film screen and defaults to the row's 12.** The mark
 * beside a list row is set against 11px caps; the one in the film screen's
 * control is set against a 24px box, and was asked to grow on 18 August. Passing
 * it rather than changing the default keeps three call sites from moving because
 * one of them was looked at.
 */
export function TickIcon({ size = 12 }: { size?: number }) {
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
      className="shrink-0"
    >
      <path d="M2.5 6.25 4.75 8.5 9.5 3.75" />
    </svg>
  )
}
