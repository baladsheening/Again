'use client'

import { OFF } from './bar'
import {
  CameraGlyph,
  CrossOffGlyph,
  RewriteGlyph,
  SearchGlyph,
  SettleGlyph,
} from './glyphs'

/**
 * **The foot: the tools.** Cross off, settle, rewrite, camera, search — **the
 * same five at every width**, including the desk.
 *
 * ⚠ **Rewrite is the fifth, and it is here because the gesture was invisible.**
 * A second tap on a line's words opens them, and a handset asked the obvious
 * question: *how would anybody know that?* Nothing on the page said so, and a
 * legend, an icon-with-copy or a hint are all ruled out on this screen. But the
 * inconsistency was the real answer — **cross off and settle are controls in the
 * foot and rewriting was a secret**, when all three are the same kind of thing:
 * something you do to the line you have picked. So it joins them, and the
 * second tap survives as the accelerator for anybody who finds it.
 *
 * ⚠ **It goes third rather than first.** Cross off and settle keep the slots
 * they have had since the foot existed — muscle memory is not worth a tidier
 * reading order — and the split that results is the honest one: the three that
 * can act, then the two that cannot.
 *
 * ⚠ **It does not sit above the keyboard, and that is the design.** It used to:
 * `useKeyboardPin` held it on the keys' top edge, which spent a bar's worth of a
 * shrunken screen on four glyphs that are **all off while somebody is writing** —
 * cross off and settle are `null` with nothing picked, and the camera and search
 * are not built. Picking a line blurs the live one, so the foot is never wanted
 * while a keyboard is up. It stays at the bottom of the layout viewport now,
 * which on iOS means behind the keys, which is where it belongs. See
 * `keyboard-hem.ts`.
 *
 * ⚠ **No rule above it.** The scrolling page reserves the foot's own height at
 * its bottom (`page-hem` in globals.css), so a line always comes to rest above
 * the glyphs rather than sliding under them. A `border-t` was correcting for a
 * collision that padding prevents outright, and Notes has none either — space
 * does the separating, 16px on the handset and 18px on the desk.
 *
 * ⚠ **The foot is 48px, down from 72 on 24 August**, and what stops it going
 * lower is `--tap-floor` rather than taste — see `--foot-lead`, which has the
 * arithmetic and the reason there is no third cut in it.
 *
 * ⚠ **Both bars are glass** — a tint over a blur of the record passing under
 * them, so a line dissolves into the chrome instead of being cut off by an edge.
 * See `--glass-tint`, which also records why the same mechanism failed on the
 * live row and why that is not an argument against it here.
 *
 * Three states, and they are the app's honest answer to what is available:
 *
 * | state | cross off | settle | rewrite | camera | search |
 * |---|---|---|---|---|---|
 * | empty page | off | off | off | **on** | off |
 * | mid-line, nothing saved | off | off | off | **on** | **on** |
 * | a saved line picked | **on** | **on** | **on** | **on** | **on** |
 *
 * The camera is the odd one because a photograph starts a capture rather than
 * acting on one.
 *
 * ⚠ **The camera and search ship OFF at every state in this first cut, and that
 * is scope rather than design.** Images are a storage layer — object storage
 * outside Postgres, size and type limits, EXIF stripping, an access-controlled
 * media path, retained provenance, reportable and removable assets — and search
 * over captures is a surface of its own. Neither is built, so neither can act,
 * and a control that cannot act goes off. **That is the design's own device
 * being honest, not a deviation from it**: the bar keeps its full shape, and the
 * day either one lands it is a prop and no new geometry. The table above is what
 * they go back to.
 */
export function Foot({
  crossOff,
  settle,
  rewrite,
  receded = false,
}: {
  /**
   * Off the bottom of the glass while the record is being read — see
   * `useChromeRecede`.
   *
   * ⚠ **It can only ever be true while both controls here are off.** The foot is
   * the picked line's toolbar, so picking holds it down; the hook owns that rule
   * and this prop is the answer, not the decision.
   */
  receded?: boolean
  /**
   * The ×, both ways: on a live line it crosses off, on a crossed-off one it
   * puts back. `null` when nothing saved is picked.
   *
   * **One control, two directions.** Nothing appears or disappears when it is
   * pressed — the row stays where it is and the strikethrough is the whole of
   * the feedback, which is why there is no confirmation and no ten-second window
   * attached to it. The way back is the same control in the same place, so a
   * mistap costs one more tap.
   */
  crossOff: { crossedOff: boolean; act: () => void } | null
  /** Settle the picked line: it leaves the page for the tray. */
  settle: (() => void) | null
  /**
   * Open the picked line's words in the band. `null` when nothing saved is
   * picked, and also while a rewrite is already open — re-opening the line
   * would throw away what is in the field for the words that are saved, which
   * is a discard nobody asked for. A control that cannot act goes off.
   */
  rewrite: (() => void) | null
}) {
  return (
    <footer
      /*
        ⚠ **One mover, since 24 August.** `useKeyboardPin` used to write
        `transform` here every frame a keyboard was arriving, to hold the foot on
        the keyboard's top edge. That is gone — see `keyboard-hem.ts` — so the
        recede's `translate` is the only thing that moves this element, and
        `will-change` names one property.
      */
      className={`gutter fixed inset-x-0 bottom-0 z-20 bg-[var(--glass-tint)] backdrop-blur-[var(--glass-blur)] transition-[translate] duration-[var(--recede)] ease-[var(--ease-recede)] will-change-[translate] ${
        receded ? 'translate-y-full' : ''
      }`}
    >
      {/* The foot's own glyph size, declared on the row — see `--glyph-foot`. */}
      <div className="mx-auto flex w-full max-w-[var(--page-measure)] items-center justify-around pt-[var(--foot-lead)] pb-[calc(var(--foot-tail)+env(safe-area-inset-bottom))] [--glyph:var(--glyph-foot)]">
        <button
          type="button"
          disabled={!crossOff}
          onClick={() => crossOff?.act()}
          aria-label={crossOff?.crossedOff ? 'Put it back' : 'Cross it off'}
          className={`tap-target flex items-center transition-colors ${
            crossOff ? 'text-chrome' : OFF
          }`}
        >
          <CrossOffGlyph />
        </button>

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
          disabled={!rewrite}
          onClick={() => rewrite?.()}
          aria-label="Rewrite it"
          className={`tap-target flex items-center transition-colors ${
            rewrite ? 'text-chrome' : OFF
          }`}
        >
          <RewriteGlyph />
        </button>

        {/* Not built — see the note at the top of this file. */}
        <button
          type="button"
          disabled
          aria-label="Photograph"
          className={`tap-target flex items-center ${OFF}`}
        >
          <CameraGlyph />
        </button>

        <button
          type="button"
          disabled
          aria-label="Search"
          className={`tap-target flex items-center ${OFF}`}
        >
          <SearchGlyph />
        </button>
      </div>
    </footer>
  )
}
