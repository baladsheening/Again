/**
 * The seven glyphs of the capture page — Phase 1.
 *
 * **One grid: `viewBox="0 0 20 20"`, rendered at 20px, `stroke-width="1.25"`.**
 * That is the geometry `ProfileIcon` already ships with, so the effective stroke
 * is 1.25px on every one of them and the set matches the app's real icons rather
 * than only matching itself.
 *
 * ⚠ **Do not scale a glyph from another viewBox into this one.** An earlier draft
 * of the design mixed viewBoxes 12, 16, 20 and 22 at a single rendered size,
 * which put four different effective stroke weights in one bar — the cross-off
 * came out at 2.29px beside a 1.25px camera. Redraw on the grid instead.
 *
 * ⚠ **`SearchIcon` in `icon-search.tsx` is a 16 viewBox at 20px** — 1.5625px of
 * effective stroke — which is why search is redrawn here rather than imported.
 * That file belongs to the masthead the page replaces.
 *
 * Two of them are a deliberate pair:
 *
 *   - **`TrayGlyph`** (the bar) is a plain tray: a *place* you go.
 *   - **`SettleGlyph`** (the foot) is the same tray, identical in width and
 *     height, with an arrow dropping into it: an *action*.
 *
 * The arrow is the only difference between the noun and the verb.
 *
 * ⚠ **The settle glyph replaced a tick, and the tick was wrong.** A tick beside a
 * line someone is typing reads as *submit* — which Return does — not as *I have
 * done this thing*. It was read that way on first sight, which is the evidence.
 *
 * ⚠ **The tray glyph replaced three horizontal lines**, which is the hamburger
 * menu everywhere on earth. §11 permits *known* icons; that one is known for
 * something else.
 *
 * `currentColor` throughout. Brass or off is decided by the bar around them —
 * see `Foot` and `Bar`, and the note in `docs/re-direction/phase-1-capture.md`
 * on what colouring the chrome cost.
 */
function Glyph({ children }: { children: React.ReactNode }) {
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
      {children}
    </svg>
  )
}

/** Bar. Notes' own undo arrow, and it deletes — see `undoCapture`. */
export function UndoGlyph() {
  return (
    <Glyph>
      <path d="M6.75 4.25 3.25 7.75l3.5 3.5" />
      <path d="M3.25 7.75h7.75a4.75 4.75 0 0 1 0 9.5H8.25" />
    </Glyph>
  )
}

/** Bar. A place: everything you are done deciding about. */
export function TrayGlyph() {
  return (
    <Glyph>
      <path d="M3.5 6.5h3.75l1 1.75h3.5l1-1.75h3.75" />
      <path d="M3.5 6.5v6a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-6" />
    </Glyph>
  )
}

/** Bar. You. Same drawing as `ProfileIcon`, on the same grid. */
export function YouGlyph() {
  return (
    <Glyph>
      <circle cx="10" cy="6.75" r="3.25" />
      <path d="M3.75 17c0-3.1 2.8-5 6.25-5s6.25 1.9 6.25 5" />
    </Glyph>
  )
}

/** Foot. Cross the picked line off — a resolution, not a delete. */
export function CrossOffGlyph() {
  return (
    <Glyph>
      <path d="M6 6 14 14" />
      <path d="M14 6 6 14" />
    </Glyph>
  )
}

/** Foot. The tray, with an arrow dropping into it: an action. */
export function SettleGlyph() {
  return (
    <Glyph>
      <path d="M10 3v4" />
      <path d="m7.9 5 2.1 2.1 2.1-2.1" />
      <path d="M3.5 9.5h3.75l1 1.75h3.5l1-1.75h3.75" />
      <path d="M3.5 9.5v6a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-6" />
    </Glyph>
  )
}

/** Foot. A photograph *starts* a capture rather than acting on one. */
export function CameraGlyph() {
  return (
    <Glyph>
      <path d="M3 7h3.25l1.25-2h5l1.25 2H17v9.5H3z" />
      <circle cx="10" cy="11.25" r="3.25" />
    </Glyph>
  )
}

/** Foot. Where is that thing I wrote in June. Not per-line. */
export function SearchGlyph() {
  return (
    <Glyph>
      <circle cx="8.75" cy="8.75" r="5.25" />
      <path d="M12.75 12.75 16.75 16.75" />
    </Glyph>
  )
}
