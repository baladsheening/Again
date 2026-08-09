/**
 * Home, at the head of the phone collection row.
 *
 * §11 permits known icons, and a house is the known one — it is the single most
 * settled glyph in interface design, which is the whole reason it can sit in a
 * row of words without a label under it.
 *
 * Same inline-rather-than-a-package reasoning as `icon-chevron.tsx`, and
 * `currentColor` for the same reason: the accent is reserved for overlap, so
 * this inherits whatever the row around it is doing.
 *
 * 14px, against 11px caps beside it. A glyph set to the exact size of the text
 * next to it reads smaller than the text, because letters have no interior — so
 * it takes the three extra pixels back.
 */
export function HomeIcon() {
  return (
    <svg
      width="14"
      height="14"
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
