/**
 * The eleven glyphs of the capture page — Phase 1, and two of Phase 2.
 *
 * **One grid: `viewBox="0 0 20 20"`, `stroke-width="1.25"`, rendered at
 * `--glyph`.** One number sizes them all, and the stroke rides with it: the
 * viewBox is fixed, so a bigger box is the same drawing larger rather than the
 * same drawing stretched thinner. See `--glyph` in globals.css for why the size
 * became a token on 24 August, and why 20px stopped being a constraint.
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
 *   - **`SettleGlyph`** (the console, since 30 August — the foot before it) is
 *     the same tray, identical in width and height, with an arrow dropping into
 *     it: an *action*.
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
      /*
        The attributes are the fallback; `size-(--glyph)` below outranks them,
        because CSS beats an SVG presentation attribute. Same arrangement as the
        film screen's corner — see `--pane-glyph`.
      */
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-(--glyph) shrink-0"
    >
      {children}
    </svg>
  )
}

/**
 * The line's own slot. Notes' undo arrow, and it deletes — see `undoCapture`.
 *
 * ⚠ **Centred on the grid, since 26 August — it was the one glyph of the eight
 * that was not.** Its ink ran y 4.25 → 17.25 inside a box centred on 10, so the
 * drawing sat three quarters of a unit low and half a unit left of every glyph
 * it appears beside, and on a line of the record it read as *sitting low*
 * against the words. The paths are the same two arcs moved by (+0.5, −0.75):
 * the ink spans 3.5 → 16.5 in both axes now, centred on 10 like the rest.
 *
 * ⚠ **A glyph off its own centre cannot be corrected from outside it.** A row
 * aligns the *box*, so a drawing that is not centred in its box is wrong at
 * every size and in every bar it is ever put in. Redraw on the grid; never
 * nudge the box.
 */
export function UndoGlyph() {
  return (
    <Glyph>
      <path d="M7.25 3.5 3.75 7l3.5 3.5" />
      <path d="M3.75 7h7.75a4.75 4.75 0 0 1 0 9.5H8.75" />
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

/**
 * Foot. Rewrite the picked line — **the only door to it**, since the second tap
 * that used to open the words came out on 25 August.
 *
 * ⚠ **A known icon, which is what §11 permits.** The pencil is the one glyph
 * everybody already reads as *change these words*, and the alternative was a
 * legend, a hint or a word of copy — all three ruled out on this screen.
 *
 * Drawn on the grid rather than scaled from a 24 one: the body is a 45° bar
 * 3.3 wide between two parallel edges, closed by a semicircular arc at the
 * eraser end and a point at the tip. The second path is the ferrule.
 */
export function RewriteGlyph() {
  return (
    <Glyph>
      <path d="M3.75 16.25 4.6 12.9 13.9 3.6a1.65 1.65 0 0 1 2.33 2.33L6.93 15.23z" />
      <path d="M12.6 4.9 15 7.3" />
    </Glyph>
  )
}

/**
 * Foot. A picture *starts* a capture rather than acting on one.
 *
 * ⚠ **It was a camera until 25 August, and the camera was overstating it on
 * every surface.** The control opens a file picker: on the desk that is a
 * window onto a hard disk with no camera anywhere near it, and even on glass the
 * input carries **no `capture` attribute** — deliberately, so that the library
 * is offered alongside the lens, because *the poster I saw last week* is at
 * least as likely as the one in front of you. A camera glyph promised the lens
 * and only the lens.
 *
 * ⚠ **One glyph, not one per surface.** The obvious reading of the report was
 * *a paperclip on the desk, a camera on glass*, and that would have been a
 * platform branch bought to keep a drawing that was wrong on both. A paperclip
 * is honest everywhere: on a handset it opens the same sheet, with the camera
 * as one of its offers.
 *
 * ⚠ **Redrawn on this grid rather than scaled onto it.** The proportions follow
 * the paperclip everybody already knows; the coordinates are computed for
 * `viewBox="0 0 20 20"` so the effective stroke is 1.25px like the other seven,
 * and the drawing is inset to 3.63 on all four sides — a shade tighter than the
 * camera's 3, because three turns of wire read busier than a box and a circle at
 * the same size.
 */
export function AttachGlyph() {
  return (
    <Glyph>
      <path d="M16.36 9.74 9.74 16.36a4.32 4.32 0 0 1-6.11-6.11l6.62-6.62a2.88 2.88 0 0 1 4.08 4.08l-6.62 6.62a1.44 1.44 0 0 1-2.04-2.04l6.11-6.11" />
    </Glyph>
  )
}

/**
 * The line's link — on the band while it waits, on the row once it is committed.
 *
 * ⚠ **A chain link, not an arrow leaving the box.** The outbound arrow says
 * *this opens elsewhere*, which every link does and which therefore says
 * nothing; the chain says *there is a thing behind these words*, which is what a
 * capture's source is. It also has to read at 14px inside a chip, where an arrow
 * and its box become two marks that touch.
 *
 * Two halves of one link, drawn as the same arc mirrored, with the bar joining
 * them — so the shape stays legible when it is the smallest thing on the page.
 */
export function LinkGlyph() {
  return (
    <Glyph>
      <path d="M8.5 11.5a3.25 3.25 0 0 0 4.9.35l2.4-2.4a3.25 3.25 0 0 0-4.6-4.6l-1.37 1.37" />
      <path d="M11.5 8.5a3.25 3.25 0 0 0-4.9-.35l-2.4 2.4a3.25 3.25 0 0 0 4.6 4.6l1.37-1.37" />
    </Glyph>
  )
}

/**
 * Foot. **Write something** — the one control that starts a capture.
 *
 * ⚠ **It is the whole of how a capture begins, since 27 August.** The page had a
 * live line pinned under the bar and the caret lived in it; the field is
 * summoned now, and this is the door. See `writing-sheet` in globals.css for why
 * the row stopped being pinned, and `Foot` for why this glyph is the middle one.
 *
 * ⚠ **A plus, not a pencil.** The pencil already means *change these words* on a
 * line of the record, and two drawings for two different acts would be a
 * vocabulary with a collision in it. A plus means *another one*, which is
 * exactly what a capture is.
 *
 * Two strokes crossing on the grid's centre, ink 4 → 16 in both axes like the
 * rest.
 */
export function WriteGlyph() {
  return (
    <Glyph>
      <path d="M10 4v12" />
      <path d="M4 10h12" />
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

/**
 * Foot. **The portal: who else.**
 *
 * ⚠⚠ **TWO OVERLAPPING CIRCLES SINCE 31 AUGUST, AND IT WAS TWO PEOPLE BEFORE.**
 * Directed, off the `RecordCorners` artboard, whose note is the argument in one
 * line: *two circles overlapping, which is what the engine computes.*
 * `lib/overlap.ts` joins two people's captures and keeps the intersection —
 * this is that set, drawn. The old glyph named the **parties**; this names the
 * **operation**, and the operation is the thing the portal is a door to.
 *
 * ⚠ **What was given up, so nobody restores it by halves.** The old drawing was
 * `YouGlyph` with a second person added, which made a pair with the bar's *you*
 * exactly as `TrayGlyph`/`SettleGlyph` do — one drawing, one addition, the
 * addition being the meaning. **That pairing is gone**, and it was real. What
 * replaces it is a different and better claim: a Venn is not a picture of people
 * at all, so it cannot be misread as a members list, which is the failure the
 * old note was already fighting when it made the second figure a partial arc.
 *
 * ⚠ **A Venn cannot be square, so this is the one glyph wider than it is tall.**
 * Height is 2r and width is 2r + d, so the two are equal only when the circles
 * coincide. The set's ink runs 3.5→16.5 both ways; this runs **2.0→18.0
 * horizontally and 4.25→15.75 vertically** — the same horizontal extent the old
 * portal glyph had, so nothing beside it in the strip shifts.
 *
 * ⚠ **d/r is 0.78, and the ratio is the drawing.** Push the centres apart and
 * the lens closes to a slit that disappears at 26px; pull them together and the
 * pair reads as one blob with a notch. The artboard sets d = r; this is a little
 * tighter because it is drawn at a third of that size.
 */
export function PortalGlyph() {
  return (
    <Glyph>
      <circle cx="7.75" cy="10" r="5.75" />
      <circle cx="12.25" cy="10" r="5.75" />
    </Glyph>
  )
}

/**
 * **The door, and the dot that says somebody is waiting on you.** Directed, 4
 * September.
 *
 * ⚠ **A request needs answering and a convergence does not, so the door cannot
 * say only *something*.** It said exactly that until now: one lit glyph for both
 * kinds of row, which made a reader open the box to find out whether anybody was
 * waiting on them.
 *
 * Three states, and the drawing never changes — only what is added to it:
 *
 * | | |
 * |---|---|
 * | nothing | the two circles, `OFF` |
 * | a convergence | the two circles, lit |
 * | **a request** | the two circles, lit, **with a dot above them** |
 *
 * ⚠⚠ **LETTERS OVER THE CIRCLES WERE BUILT FIRST AND LOOKED AT, AND THEY WERE A
 * SMUDGE.** `C`, `R` and `C/R` overlaid on the glyph at 26px collide with the
 * strokes of both circles — the counters of the `C` and the bowl of the `R` land
 * on the drawing and the whole thing reads as ink rather than as two characters.
 * Rendered at `door-overlay.png`. **The direction anticipated this and named the
 * fallback**, which is what this is.
 *
 * ⚠ **A `+` was ruled out before either.** The capture control is a `+` two
 * cells away in the same bar, and this app cannot afford two plus-shapes side by
 * side on the one control it has to be perfect at.
 *
 * ⚠⚠ **IT IS STILL NOT A COUNT.** One dot however many people are asking, no
 * digits anywhere, and `portal.mjs`'s assertion holds unchanged. §5 forbids a
 * number — a thing to clear — not a distinction. ⚠ **It is nonetheless the
 * closest this app has come to a notification badge, and that is the thing to
 * watch: if a second dot is ever proposed for a second kind of row, the answer
 * is that the door has run out of what it can say and the surface behind it is
 * where the distinction belongs.**
 *
 * ⚠ **The clearance is measured against the ink, not against the circles' own
 * bounding box, and the first attempt got that wrong.** At the dot's x the two
 * circles cross near their tops, so the outline there is at y 4.71 and the
 * stroke takes it to 4.09 — a dot ending at 4.1 read as a **stem**, a lollipop
 * rather than two marks. It sits at cy 1.75
 * with r 1.15 now, ending at 2.9: **1.2 units of clear ground, about 1.5px at the
 * handset's 26px and four device pixels at 3×.**
 *
 * ⚠ **Filled — the one filled shape in the eleven.** A ring at this size is a
 * grey blur, and a dot has to be a dot.
 *
 * ⚠ **`currentColor`, like everything else here.** Lit and off are the bar's
 * decision, so the dot cannot be brighter than the glyph it belongs to — and
 * §11 has no colour to spare on a control.
 */
export function PortalMark({ requests }: { lines: boolean; requests: boolean }) {
  return (
    <Glyph>
      <circle cx="7.75" cy="10" r="5.75" />
      <circle cx="12.25" cy="10" r="5.75" />
      {requests && <circle cx="10" cy="1.75" r="1.15" fill="currentColor" stroke="none" />}
    </Glyph>
  )
}

/**
 * **The lock, on a line of the record — 31 August.** *This capture is out of the
 * convergence pool.* The row's swipe puts it there and takes it away, and this
 * is what says so.
 *
 * ⚠ **It is a STATE, not a control, and that is why a padlock is right here
 * when it would have been wrong on a button.** As a label a padlock says
 * *security*, and this is scope rather than secrecy — nothing about a lock stops
 * anybody reading a record they can already reach. As a mark on a line it is the
 * one drawing every reader on earth already knows for *held back*, and §11
 * permits known icons for exactly that reason.
 *
 * ⚠ **It exists because a swipe on iOS has no other confirmation.** There is no
 * Vibration API on Safari, so the only thing that can tell a hand its gesture
 * landed is the eye. Crossing off struck the line where it stood; locking would
 * have changed nothing visible at all. See the note at the head of
 * `row-swipe.ts` — **do not remove this while the swipe carries the lock.**
 *
 * ⚠ **Drawn shorter than the other ten, deliberately.** The ink spans y 4.6 →
 * 15.4 rather than the set's usual 3.5 → 16.5: it rides a line of the record
 * beside 13px furniture — the year, the `?` — rather than standing in a bar, and
 * a full-height padlock beside a year reads as a control somebody could press.
 * The width is centred on 10 like the rest, so it sits on the grid.
 */
export function LockGlyph() {
  return (
    <Glyph>
      <rect x="5.25" y="9.25" width="9.5" height="6.15" rx="1.35" />
      <path d="M7.6 9.25V7.4a2.4 2.4 0 0 1 4.8 0v1.85" />
    </Glyph>
  )
}
