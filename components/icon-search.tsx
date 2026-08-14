/**
 * Search, in the phone header, beside the way to your profile.
 *
 * **It replaced the house on 15 August.** Home is still one tap away on the
 * wordmark, which has always linked there and which a masthead is expected to;
 * search had no route of its own once the bottom bar stopped carrying a field,
 * and of the two, search is the one nobody would guess at.
 *
 * §11 permits known icons, and a magnifying glass is the most settled glyph in
 * interface design after the house it replaced — which is what lets it sit
 * unlabelled next to another unlabelled glyph and still be read.
 *
 * Same inline-rather-than-a-package reasoning as `icon-chevron.tsx`, and
 * `currentColor` for the same reason: the accent is reserved for overlap, so
 * this inherits whatever the row around it is doing.
 *
 * **20px and a 16px viewBox, matching `ProfileIcon` and the house before it.**
 * Two icons of different sizes side by side read as a mistake rather than as a
 * hierarchy.
 */
export function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="7" cy="7" r="4.75" />
      <path d="M10.4 10.4 14 14" />
    </svg>
  )
}
