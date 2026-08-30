'use client'

import Link from 'next/link'

import { OFF } from './bar'
import { PortalGlyph, SearchGlyph, WriteGlyph } from './glyphs'

/**
 * **The tools: write and search.**
 *
 * ⚠ **Settle left on 30 August, and the note below predicted it in writing.**
 * It said: *settle is the last asymmetry… if the grouping is revisited, settle
 * is the thing to move — onto the line, where the other two that act on it
 * already are, which would leave search alone and this file with nothing to be.*
 * A tap on a line opens a **console** now, and cross off, rewrite and settle are
 * all on its bottom edge — so the prediction came true in one move rather than
 * three, and the answer to *this file with nothing to be* is that it has one job
 * left and it is a good one: **the `+`.**
 *
 * ⚠ **What is left is genuinely not per-line**, which is the test this bar has
 * been failing since 25 August: one control that starts a capture, and one that
 * goes somewhere. Nothing here reads what the record has open.
 *
 * ⚠ **Write arrived on 27 August and it is the reason this bar exists now.**
 * The page had a live line pinned under the bar; the field is summoned, and
 * this is what summons it. That reverses the argument that sent attach away
 * from here — *a photograph starts a capture rather than acting on one, the
 * only control here that does not care what is picked* — because the thing a
 * capture starts **in** is now summoned from this bar too. Attach goes back on
 * the field, which is where what it makes appears; that rule is untouched.
 *
 * ⚠ **It is the middle glyph, and that is a rule rather than a preference.** It
 * is the app's one primary action, and the centre of the bar is the single
 * position equally within reach of either thumb.
 *
 * ⚠ **It is central by construction since 30 August, not by arithmetic.** Three
 * glyphs under `justify-around` put it in the middle *because there were three
 * of them*; take one away and it drifts to a quarter of the way across, which is
 * what removing settle would have done silently. The bar is a three-column grid
 * now and the `+` names its column, so it holds the centre at two glyphs and
 * would hold it at one.
 *
 * ⚠ **It lights an empty page, which is what attach used to do.** A first run
 * has no record, so search is off — and *controls go off; they do not disappear*
 * only reads as deliberate if something on the screen is lit. This is that
 * something, and unlike attach it is never off: there is nowhere a capture
 * cannot be started.
 *
 * ⚠ **It was five on the morning of 25 August, two by that evening, three again
 * on the 27th, and two since the 30th** — and every one of those moves went the
 * same way: a control belongs where its effect appears.
 *
 * - **Cross off, rewrite and settle** all act on one capture, so they are on the
 *   **console** — the box that shows the capture they act on. See
 *   `console.tsx`. The record's own slot keeps only the undo, for the ten
 *   seconds after a line lands; see `LineUndo` in `page-screen.tsx`.
 * - **Attach** is on the **field**, because it starts a capture rather than
 *   acting on one. This file's own note had been saying so for a day: *the only
 *   control here that does not care what is picked*. The link chip arriving
 *   beside it is what made it unarguable — the control that creates an
 *   attachment was somewhere other than where the attachment appears.
 *
 * ⚠ **Two placements, one set.** Below `--breakpoint-stack` these are a bar
 * across the foot of the glass; at and above it they stand in a column to the
 * left of the reading column — see `ToolStack`. The glyphs, their order and
 * their states are identical in both, which is what keeps this one component
 * rather than two designs.
 *
 * ⚠ **It does not sit above the keyboard, and that is the design.** It used to:
 * `useKeyboardPin` held it on the keys' top edge, which spent a bar's worth of a
 * shrunken screen on glyphs that are all off while somebody is writing. It stays
 * at the bottom of the layout viewport, which on iOS means behind the keys, and
 * it recedes outright while the sheet is up — so the thing that rides the keys'
 * top edge is the field, which is the one thing that wants to be there. See
 * `writing-sheet` and `keyboard-hem.ts`.
 *
 * ⚠ **No rule above it.** The scrolling page reserves the foot's own height at
 * its bottom (`page-hem` in globals.css), so a line always comes to rest above
 * the glyphs rather than sliding under them. A `border-t` was correcting for a
 * collision that padding prevents outright, and Notes has none either — space
 * does the separating.
 *
 * ⚠ **The foot is 48px, down from 72 on 24 August**, and what stops it going
 * lower is `--tap-floor` rather than taste — see `--foot-lead`.
 *
 * ⚠ **Both bars are glass** — a tint over a blur of the record passing under
 * them, so a line dissolves into the chrome instead of being cut off by an edge.
 * See `--glass-tint`.
 *
 * Two states, and they are the app's honest answer to what is available:
 *
 * | state | write | search |
 * |---|---|---|
 * | empty record | **on** | off |
 * | a record | **on** | **on** |
 *
 * ⚠ **Neither depends on what is open any more**, which is what removes the
 * third row this table used to have. The bar cannot be lit or dark because of a
 * line; it answers *is there a record* and nothing else.
 *
 * ⚠ **Write is never off, and it is the only entry here that never is.** The
 * other control needs something to act on; there is nowhere a capture cannot be
 * started. On a first run it is the one lit thing on the screen, which is the
 * job attach used to do here before it went to the field — and *controls go off;
 * they do not disappear* only reads as deliberate when something is lit.
 *
 * ⚠ **The whole bar goes while the sheet is up.** It is not a stacking problem:
 * the sheet rests on `--keyboard-overlap`, which is zero wherever there is no
 * on-screen keyboard, so the two would share the bottom edge. Neither of these
 * is wanted while somebody is writing, and the `+` least of all — it would be a
 * second door to the thing already open. See `PageScreen`.
 *
 * ⚠ **It does NOT go while a console is open, and that is deliberate.** The
 * console takes the scrim at `z-5` and the strip stays at `z-20`, so the `+` is
 * still there and still lit — which makes it a real door from *looking at a
 * capture* to *writing the next one*, and `openSheet` closes the console on the
 * way through. One scrim, one occupant, and this is how the occupant changes.
 *
 * ⚠ **Search is the one link here, so it is an `<a>` and not a button.**
 * Everything else acts on the line in hand; this goes somewhere. A button with a
 * `router.push` would look identical and lose the middle-click, the long press
 * and the back button, which are the whole of what a link is for.
 *
 * ⚠ **Row two of the table is where this deviates from the design.** The design
 * lights search while a line is being typed with nothing saved; it is lit here
 * whenever there is a **record**, and dark when there is not. Searching an empty
 * record is a surface that can only answer *Nothing.*, and *a control that
 * cannot act goes off* is the rule the rest of this bar already follows.
 */
type Tools = {
  /**
   * Summon the field. **Never null** — a capture can always be started.
   *
   * ⚠ **It must focus the field synchronously inside its own click handler**,
   * or iOS will not raise a keyboard. That is the caller's job and it is why
   * the field is mounted at all times — see `openSheet` in `page-screen.tsx`.
   */
  write: () => void
  /**
   * Whether there is a record to search. `false` on an empty page, where the
   * only answer the surface could give is *Nothing.*
   */
  searchable?: boolean
  /**
   * **Open the portal: what happened while you were away.** Phase 2 step 3.
   *
   * ⚠ **`null` where there is no portal to open** — every route but the capture
   * page. `/settled`, `/profile` and somebody else's page render `ToolSet` too,
   * and the portal's rows open consoles, which only the record has.
   */
  portal?: (() => void) | null
  /**
   * **The one bit, and it is the only thing the door is allowed to say.**
   *
   * §5: *never a count. One bit at most — something is there, or nothing is.* A
   * number is a thing to clear, and `CLAUDE.md` excludes engagement metrics by
   * name. `hasPortalLines` returns a boolean for this reason rather than as a
   * convenience — see its note.
   *
   * ⚠ **It is drawn with the bar's existing device, not a new one.** *Controls
   * go off; they do not disappear* — so the portal is lit when there is
   * something and `OFF` when there is not, which is exactly what search already
   * does with an empty record. **No dot, no badge, no ring**: the page has one
   * way of saying a control can act and this is it.
   */
  portalLit?: boolean
}

/**
 * The two, in order, with nothing said about how they are arranged. Both
 * placements render this and neither may reorder it.
 *
 * ⚠ **`col-start-*` is how the `+` stays in the middle of the bar, and it is
 * inert in the stack.** The bar used to have three glyphs spread by
 * `justify-around`, so the `+` was central **by there happening to be three of
 * them** — take one away and it drifts to a quarter of the way across. The bar
 * is a three-column grid now and these say which column each lands in, so the
 * `+` is central by construction and would survive losing search too. Grid
 * placement has no effect on a flex item, so the vertical stack ignores both.
 */
function ToolSet({ write, searchable = false, portal = null, portalLit = false }: Tools) {
  return (
    <>
      {/*
        ⚠ **Column one, which the bar has been holding empty since settle left on
        30 August.** The `+` names column two and search names column three, so
        this cost no layout and moved nothing: the grid was already three wide
        because the centre is a rule rather than an average. See the head of this
        file.

        ⚠⚠ **§2 of `phase-2-convergence.md` puts the portal at the TOP, and this
        is the bottom — directed 30 August, against that law.** The law reads:
        *the bottom edge is for what you do without looking, the top edge is for
        what you go to on purpose… which is also why the notification portal goes
        at the top: it is visited once, deliberately, at the start of a session,
        and must never be given a reflex's real estate.* **The direction was
        given knowing that, and it stands.** What it costs is written here rather
        than argued: the portal now sits beside the one control this app has to
        be perfect at, and a thumb reaching for `+` has a neighbour it did not
        have. **If the `+` is ever mis-hit, this is the first suspect**, and the
        answer is the top edge and not a bigger gap.

        ⚠ **A `<button>`, not a `<Link>`, because the portal is not a route.** It
        is a sheet over the record — the same argument the console and the
        writing strip both won: *a sheet is not a route.* Its rows open consoles,
        and a console only exists where the record is.
      */}
      {/*
        ⚠ **An EMPTY portal has no door, and that is §5 rather than a nicety.**
        *An empty portal is the resting state and the honest signal that there is
        nothing to know* — so a box that would open on nothing is not a smaller
        version of the portal, it is the surface the brief says must not exist.
        Off is the drawing without the door, exactly as search's is: a `<span>`,
        because there is no disabled state for a control that opens something,
        and the label goes with the door rather than staying on a drawing a
        reader would be told they can reach.
      */}
      {portal && portalLit ? (
        <button
          type="button"
          onClick={portal}
          aria-label="Who else"
          className="text-chrome tap-target col-start-1 flex items-center transition-colors"
        >
          <PortalGlyph />
        </button>
      ) : (
        /*
          Off is the drawing without the door, exactly as search's is — see the
          note on the `<span>` below for why the label goes with the door rather
          than staying on something a reader would be told it can reach.
        */
        <span aria-hidden className={`tap-target col-start-1 flex items-center ${OFF}`}>
          <PortalGlyph />
        </span>
      )}

      {/*
        ⚠ **The middle one, and the only one that is never off.** See the note at
        the head of this file: the centre is what either thumb reaches, and this
        is the app's one primary action.
      */}
      <button
        type="button"
        onClick={write}
        aria-label="Write a capture"
        className="text-chrome tap-target col-start-2 flex items-center"
      >
        <WriteGlyph />
      </button>

      {searchable ? (
        <Link
          href="/search"
          aria-label="Search"
          className="text-chrome tap-target col-start-3 flex items-center transition-colors"
        >
          <SearchGlyph />
        </Link>
      ) : (
        /*
          ⚠ **A `<span>`, not a disabled `<a>`.** There is no disabled state for
          a link — an `<a>` without an `href` is not a control at all — so the
          off state is the drawing without the door, and the `aria-label` goes
          with the door rather than staying on something a screen reader would
          announce as reachable.
        */
        <span aria-hidden className={`tap-target col-start-3 flex items-center ${OFF}`}>
          <SearchGlyph />
        </span>
      )}
    </>
  )
}

/**
 * **The tools as one state of the strip on the bottom edge. Below `stack` only.**
 *
 * ⚠ **It stopped being a bar of its own on 28 August.** It was a `fixed` element
 * with its own ground, its own lead and tail, and its own recede — and it sat on
 * the same edge of the glass as the writing sheet, 44px against the sheet's 36,
 * so starting a capture changed the shape of the bottom of the screen. Directed:
 * *the row at the bottom that contains the glyphs should simply swap out the
 * glyphs for the live row.* So this is now a row inside that strip, and the
 * strip owns the position, the ground, the air and the recede. See
 * `writing-sheet` and the strip in `page-screen.tsx`.
 *
 * ⚠ **What went with the box:** `--foot-lead`, `--foot-tail`, their 45rem
 * overrides, the `fixed inset-x-0 bottom-0`, the glass, the safe-area padding,
 * the recede's `translate` and `will-change`. Every one of them is the strip's
 * now, stated once instead of twice.
 *
 * ⚠ **`hidden` fades, it does not unmount, and it must not become
 * `display: none`.** The strip is a grid with one cell: this row and the field
 * row are stacked in it, so the strip's height is the taller of the two and
 * never changes as they swap. Removing either from the flow would let the strip
 * resize, which is the whole thing this replaced.
 */
export function Foot({
  hidden = false,
  ...tools
}: Tools & {
  /** Somebody is writing, so the field has the strip. */
  hidden?: boolean
}) {
  return (
    <footer
      /*
        ⚠ **The glyph row is 26px inside a 28px cell, and that is what keeps the
        44px.** `tap-target`'s pseudo-element is 44px centred on the button, so
        it reaches 9px past it — 1px of the cell and the strip's 8px hem — and
        stops flush with the strip's own edges. Nothing overhangs onto the record
        above or the keyboard below.

        ⚠ **A three-column grid, where it was `flex justify-around` — 30
        August.** With three glyphs those two are the same picture: thirds, each
        centred, at 1/6, 1/2 and 5/6. With **two** they are not — `justify-around`
        would put the `+` at a quarter and search at three quarters, moving both
        of them because one left. The columns are the arrangement stated rather
        than implied, so the `+` holds the centre and search holds the place it
        already had, and the empty first column is exactly the space settle
        vacated. `ToolSet` names the columns; see its note for why that is inert
        in the stack.

        ⚠ **The outer `col-start-1 row-start-1` is the STRIP's grid, not this
        one.** The footer is a cell of the one-cell grid it shares with the
        writing row — that is what stops the strip resizing between its two
        states — and a grid container in its own right. Two grids, one element,
        and neither reads the other's placement.
      */
      className={`col-start-1 row-start-1 stack:hidden mx-auto grid w-full max-w-[var(--page-measure)] grid-cols-3 items-center justify-items-center transition-opacity duration-[var(--recede)] ease-[var(--ease-recede)] [--glyph:var(--glyph-foot)] ${
        hidden ? 'pointer-events-none opacity-0' : ''
      }`}
    >
      <ToolSet {...tools} />
    </footer>
  )
}

/**
 * **The same two, standing to the left of the reading column.** At
 * `--breakpoint-stack` and above.
 *
 * ⚠ **Its top glyph is level with the first line of the record**, and the
 * arithmetic says so rather than a measurement finding it: the page's own top
 * padding, plus the block a day stamp occupies, because the record always opens
 * with one. See `--stamp-block`.
 *
 * ⚠ **Anchored to the column, not to the window.** `left` is the middle of the
 * viewport walked back by half the measure and the gutter the words sit in, then
 * the stack's own air — so it holds its distance from the *text* at every width
 * above the breakpoint, instead of drifting out to the window's edge on a wide
 * monitor. `--breakpoint-stack` is what guarantees the result is on screen.
 *
 * ⚠ **A tint over a blur and no outline**, which is what the bars are. The
 * shape is the only thing that says *these belong together*; a border would be
 * the one rule this design does not have anywhere else.
 *
 * ⚠ **The air between the glyphs is its own token and the padding matches it**,
 * so the column has one rhythm rather than a gap and an unrelated inset. It was
 * `gap-1` for an hour and read cramped on sight — see `--stack-gap` for the
 * overlap floor it is built on and why only half of it scales with the type.
 *
 * ⚠ **It does not recede.** The bar and the foot leave while the record is read
 * because they sit over it; this sits beside it and covers nothing, so there is
 * nothing to get out of the way of.
 */
export function ToolStack(tools: Tools) {
  return (
    <div
      /*
        ⚠ **The `left` has a floor, and the stack is CENTRED on the mark's
        midpoint there — 28 August.** Directed: the vertical glyphs may never go
        past the middle of the logo's column, *and at the point the clamp takes
        over they should be at that midpoint.* This sits a fixed distance left of
        the reading column, so it tracks the column outward as the window narrows
        — measured at 1280 its left edge was 91 against a midpoint of 100, and at
        1152 it was 27. The `max()` stops it.

        ⚠ **`+ --stack-width / 2`, and the half is the whole correction.** With
        the whole width the stack's *left edge* landed on the midpoint, which put
        the glyph drawings 12px to the right of it — the box was at the midpoint
        and the marks were not. Half puts the box's centre there, and the glyphs
        are centred in the box, so what sits on the mark's midpoint is the
        drawing. It also moves the handover to 1240px, where the two terms are
        equal: at the width the clamp engages, the glyphs are exactly on the
        midpoint and nothing jumps. Above it the second term wins and nothing has
        changed at all. See `--mark-column` in globals.css.

        ⚠ **`--record-measure`, so it tracks the column that is actually drawn**
        rather than the one the page would like. Both terms then agree with
        `main` at every width, without either being told the window's size.
      */
      className="stack:flex fixed top-[calc(var(--bar-height)+var(--page-lead)+var(--stamp-block))] left-[max(calc(var(--mark-column-mid)+var(--stack-width)/2),calc(50%-var(--record-measure)/2+var(--gutter-l)-var(--stack-inset)))] z-20 hidden w-[var(--stack-width)] -translate-x-full flex-col items-center gap-[var(--stack-gap)] rounded-2xl bg-[var(--glass-tint)] py-[var(--stack-gap)] backdrop-blur-[var(--glass-blur)] [--glyph:var(--glyph-foot)]"
    >
      <ToolSet {...tools} />
    </div>
  )
}
