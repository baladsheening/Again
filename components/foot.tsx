'use client'

import { OFF } from './bar'
import { CameraGlyph, CrossOffGlyph, SearchGlyph, SettleGlyph } from './glyphs'

/**
 * **The foot: the tools.** Cross off, settle, camera, search — **the same four
 * at every width**, including the desk.
 *
 * ⚠ **No rule above it.** The scrolling page reserves the foot's own height at
 * its bottom (`page-hem` in globals.css), so a line always comes to rest above
 * the glyphs rather than sliding under them. A `border-t` was correcting for a
 * collision that padding prevents outright, and Notes has none either — space
 * does the separating, 26px on the handset and 28px on the desk.
 *
 * Three states, and they are the app's honest answer to what is available:
 *
 * | state | cross off | settle | camera | search |
 * |---|---|---|---|---|
 * | empty page | off | off | **on** | off |
 * | mid-line, nothing saved | off | off | **on** | **on** |
 * | a saved line picked | **on** | **on** | **on** | **on** |
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
  footRef,
  crossOff,
  settle,
}: {
  footRef: React.RefObject<HTMLElement | null>
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
}) {
  return (
    <footer
      ref={footRef}
      /*
        `will-change: transform` is deliberate: `useKeyboardPin` writes a
        `translateY` to this element every frame for the length of a keyboard's
        arrival, and promoting it once is cheaper than the compositor deciding
        anew each time.
      */
      className="bg-bg gutter fixed inset-x-0 bottom-0 z-20 will-change-transform"
    >
      <div className="mx-auto flex w-full max-w-[var(--page-measure)] items-center justify-around pt-[var(--foot-lead)] pb-[calc(var(--foot-tail)+env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!crossOff}
          onClick={() => crossOff?.act()}
          aria-label={crossOff?.crossedOff ? 'Put it back' : 'Cross it off'}
          className={`tap-target flex items-center transition-colors ${
            crossOff ? 'text-accent' : OFF
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
            settle ? 'text-accent' : OFF
          }`}
        >
          <SettleGlyph />
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
