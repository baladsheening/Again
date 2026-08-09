/**
 * The way to `/profile` on a phone, where the handle and *Sign out* used to sit
 * as text in the header.
 *
 * Those two took the whole right-hand half of the header row to say something
 * nobody needs while they are using the app — your own handle is the one name
 * you already know. The icon costs 20px and gives the row back to the wordmark.
 *
 * §11 permits known icons; head-and-shoulders is the known one for *you*.
 * `currentColor`, because the accent marks overlap and nothing else.
 *
 * Larger than `HomeIcon` at 20px: it is alone in its row rather than beside
 * text, and it is a tap target in its own right rather than the head of a line.
 */
export function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="10" cy="6.75" r="3.25" />
      <path d="M3.75 17c0-3.1 2.8-5 6.25-5s6.25 1.9 6.25 5" />
    </svg>
  )
}
