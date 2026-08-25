'use client'

import Link from 'next/link'

import { OFF } from './bar'
import { CameraGlyph, SearchGlyph, SettleGlyph } from './glyphs'

/**
 * **The tools: settle, camera, search.**
 *
 * ⚠ **It was five until 25 August, and the two that left went to the line.**
 * Cross off and rewrite act on a *picked* line, and they are in that line's own
 * slot now — see `LineTools` in `page-screen.tsx`, which also carries the undo
 * for the ten seconds after a capture lands. What is left here is the three that
 * do not belong to any one line: settle sends the picked line to the tray, the
 * camera *starts* a capture, and search answers *where is that thing I wrote in
 * June*.
 *
 * ⚠ **Settle stayed, and it is the one asymmetry in that split.** It acts on the
 * picked line exactly as cross off and rewrite do, so on the face of it it
 * belongs beside them; it is here because it was directed here, and because
 * three glyphs on a line is a toolbar rather than a slot. If the split reads
 * wrong on hardware, **settle is the thing to move**, not the other two to move
 * back.
 *
 * ⚠ **Two placements, one set.** Below `--breakpoint-stack` these are a bar
 * across the foot of the glass; at and above it they stand in a column to the
 * left of the reading column — see `ToolStack`. The glyphs, their order and
 * their states are identical in both, which is what keeps this one component
 * rather than two designs.
 *
 * ⚠ **It does not sit above the keyboard, and that is the design.** It used to:
 * `useKeyboardPin` held it on the keys' top edge, which spent a bar's worth of a
 * shrunken screen on glyphs that are mostly off while somebody is writing.
 * Picking a line blurs the live one, so the foot is never wanted while a
 * keyboard is up. It stays at the bottom of the layout viewport now, which on
 * iOS means behind the keys, which is where it belongs. See `keyboard-hem.ts`.
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
 * Three states, and they are the app's honest answer to what is available:
 *
 * | state | settle | camera | search |
 * |---|---|---|---|
 * | empty record | off | **on** | off |
 * | a record, nothing picked | off | **on** | **on** |
 * | a saved line picked | **on** | **on** | **on** |
 *
 * The camera is the odd one because a photograph **starts** a capture rather
 * than acting on one — so it is lit at every state, including the empty page,
 * and it is the only control here that does not care what is picked. It is off
 * only when there is nowhere to put a photograph, which is a store that has not
 * been created rather than a feature that has not been built.
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
  /** Settle the picked line: it leaves the page for the tray. */
  settle: (() => void) | null
  /**
   * Open the picker. `null` when there is nowhere to put a photograph.
   *
   * ⚠ **It is a store that does not exist, not a feature that is not built.**
   * Create a Blob store and set `BLOB_READ_WRITE_TOKEN`, and it lights on the
   * next deploy with no code change.
   */
  photograph: (() => void) | null
  /**
   * Whether there is a record to search. `false` on an empty page, where the
   * only answer the surface could give is *Nothing.*
   */
  searchable?: boolean
}

/**
 * The three, in order, with nothing said about how they are arranged. Both
 * placements render this and neither may reorder it.
 */
function ToolSet({ settle, photograph, searchable = false }: Tools) {
  return (
    <>
      <button
        type="button"
        disabled={!settle}
        onClick={() => settle?.()}
        aria-label="Settle it"
        className={`tap-target flex items-center transition-colors ${
          settle ? 'text-chrome' : OFF
        }`}
      >
        <SettleGlyph />
      </button>

      <button
        type="button"
        disabled={!photograph}
        onClick={() => photograph?.()}
        aria-label="Photograph"
        className={`tap-target flex items-center transition-colors ${
          photograph ? 'text-chrome' : OFF
        }`}
      >
        <CameraGlyph />
      </button>

      {searchable ? (
        <Link
          href="/search"
          aria-label="Search"
          className="text-chrome tap-target flex items-center transition-colors"
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
        <span aria-hidden className={`tap-target flex items-center ${OFF}`}>
          <SearchGlyph />
        </span>
      )}
    </>
  )
}

/** The tools as a bar across the foot of the glass. Below `stack` only. */
export function Foot({
  receded = false,
  ...tools
}: Tools & {
  /**
   * Off the bottom of the glass while the record is being read — see
   * `useChromeRecede`.
   */
  receded?: boolean
}) {
  return (
    <footer
      /*
        ⚠ **One mover, since 24 August.** `useKeyboardPin` used to write
        `transform` here every frame a keyboard was arriving. That is gone — see
        `keyboard-hem.ts` — so the recede's `translate` is the only thing that
        moves this element, and `will-change` names one property.
      */
      className={`gutter stack:hidden fixed inset-x-0 bottom-0 z-20 bg-[var(--glass-tint)] backdrop-blur-[var(--glass-blur)] transition-[translate] duration-[var(--recede)] ease-[var(--ease-recede)] will-change-[translate] ${
        receded ? 'translate-y-full' : ''
      }`}
    >
      {/* The foot's own glyph size, declared on the row — see `--glyph-foot`. */}
      <div className="mx-auto flex w-full max-w-[var(--page-measure)] items-center justify-around pt-[var(--foot-lead)] pb-[calc(var(--foot-tail)+env(safe-area-inset-bottom))] [--glyph:var(--glyph-foot)]">
        <ToolSet {...tools} />
      </div>
    </footer>
  )
}

/**
 * **The same three, standing to the left of the reading column.** At
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
      className="stack:flex fixed top-[calc(var(--bar-height)+var(--band-height)+var(--band-tail)+var(--stamp-block))] left-[calc(50%-var(--page-measure)/2+var(--gutter-l)-var(--stack-inset))] z-20 hidden w-[var(--stack-width)] -translate-x-full flex-col items-center gap-[var(--stack-gap)] rounded-2xl bg-[var(--glass-tint)] py-[var(--stack-gap)] backdrop-blur-[var(--glass-blur)] [--glyph:var(--glyph-foot)]"
    >
      <ToolSet {...tools} />
    </div>
  )
}
