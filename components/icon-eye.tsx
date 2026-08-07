/**
 * The reveal control on password fields. §11 permits known icons, and the eye is
 * the known one — it is worth nothing as decoration and everything as the glyph
 * people already recognise for this.
 *
 * Inline rather than from a package: two usages do not justify an icon
 * dependency, and §10 wants a reason written down before one is added. Shared in
 * this file rather than pasted into both forms, because duplicated path data
 * drifts and the drift is invisible.
 *
 * `currentColor` throughout, so it inherits the muted/hover treatment of the
 * button that wraps it rather than carrying colour of its own. The accent is not
 * available here — §11 reserves amber for overlap state.
 */
export function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1.5 8S3.9 3.5 8 3.5 14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
      {off && <path d="M2.75 13.25 13.25 2.75" />}
    </svg>
  )
}
