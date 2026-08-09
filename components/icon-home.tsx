/**
 * Home — the poster wall of what is on — in the phone header, beside the way to
 * your profile.
 *
 * §11 permits known icons, and a house is the known one: the single most settled
 * glyph in interface design, which is why it can sit unlabelled next to another
 * unlabelled glyph and still be read.
 *
 * Same inline-rather-than-a-package reasoning as `icon-chevron.tsx`, and
 * `currentColor` for the same reason: the accent is reserved for overlap, so
 * this inherits whatever the row around it is doing.
 *
 * **20px, matching `ProfileIcon`.** It was 14px while it sat at the head of the
 * collection row, sized against the 11px caps beside it; paired with the profile
 * glyph instead, the thing it has to agree with is that glyph, and two icons of
 * different sizes side by side read as a mistake rather than as a hierarchy.
 */
export function HomeIcon() {
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
      <path d="M2 6.4 8 1.9l6 4.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.4Z" />
    </svg>
  )
}
