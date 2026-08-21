/**
 * Clears the search, putting the listing back.
 *
 * §11 permits known icons, and a cross is the known one for "undo this input".
 * It appears only while there is something to clear — a permanent × beside an
 * empty field is a control that does nothing, which is worse than no control.
 *
 * Same inline-rather-than-a-package reasoning as `icon-chevron.tsx`, and
 * `currentColor` for the same reason: the accent marks overlap and nothing else,
 * so this inherits the muted treatment of the row it sits in.
 *
 * 14px against a 16px field: a cross is two strokes and no interior, so at the
 * text's own size it reads smaller than the text does.
 *
 * `size` is for the one caller that is not beside type at all — the poster's
 * own dismiss control, which sits on artwork rather than in a row and has to
 * read at arm's length. Defaulted, so the two callers that grew up beside text
 * keep the size the note above argues for.
 */
export function CloseIcon({ size = 14 }: { size?: number } = {}) {
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
      <path d="m3.25 3.25 5.5 5.5M8.75 3.25l-5.5 5.5" />
    </svg>
  )
}
