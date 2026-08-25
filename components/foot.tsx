'use client'

import Link from 'next/link'

import { OFF } from './bar'
import { SearchGlyph, SettleGlyph } from './glyphs'

/**
 * **The tools: settle and search.**
 *
 * ⚠ **It was five on the morning of 25 August and it is two by the evening**,
 * and the three that left all went to where their effect appears.
 *
 * - **Cross off and rewrite** act on a *picked* line, so they are in that line's
 *   own slot — `LineTools` in `page-screen.tsx`, which also carries the undo for
 *   the ten seconds after a capture lands.
 * - **Attach** is on the **live row**, because it starts a capture rather than
 *   acting on one. This file's own note had been saying so for a day: *the only
 *   control here that does not care what is picked*. The link chip arriving on
 *   the live row is what made it unarguable — the control that creates an
 *   attachment was somewhere other than where the attachment appears.
 *
 * What is left is genuinely not per-line: settle sends the picked line to the
 * tray, and search answers *where is that thing I wrote in June*.
 *
 * ⚠ **Settle is the last asymmetry, and it is now the only one.** It acts on the
 * picked line exactly as cross off and rewrite do, and it stayed because it was
 * directed here and because three glyphs on a line is a toolbar rather than a
 * slot. With attach gone that argument is thinner than it was: this bar is one
 * line-action and one navigation. **If the grouping is revisited, settle is the
 * thing to move** — onto the line, where the other two that act on it already
 * are, which would leave search alone and this file with nothing to be.
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
 * | state | settle | search |
 * |---|---|---|
 * | empty record | off | off |
 * | a record, nothing picked | off | **on** |
 * | a saved line picked | **on** | **on** |
 *
 * ⚠ **Both are off on an empty page, which the five never were.** Attach was
 * what lit that screen — the one control a first run could use — and it has
 * gone to the live row, where a first run is already looking. This bar is dark
 * on arrival now, and *controls go off; they do not disappear* is what stops
 * that reading as broken.
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
   * Whether there is a record to search. `false` on an empty page, where the
   * only answer the surface could give is *Nothing.*
   */
  searchable?: boolean
}

/**
 * The two, in order, with nothing said about how they are arranged. Both
 * placements render this and neither may reorder it.
 */
function ToolSet({ settle, searchable = false }: Tools) {
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
      className="stack:flex fixed top-[calc(var(--bar-height)+var(--band-height)+var(--band-tail)+var(--stamp-block))] left-[calc(50%-var(--page-measure)/2+var(--gutter-l)-var(--stack-inset))] z-20 hidden w-[var(--stack-width)] -translate-x-full flex-col items-center gap-[var(--stack-gap)] rounded-2xl bg-[var(--glass-tint)] py-[var(--stack-gap)] backdrop-blur-[var(--glass-blur)] [--glyph:var(--glyph-foot)]"
    >
      <ToolSet {...tools} />
    </div>
  )
}
