'use client'

import { useEffect, useRef } from 'react'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The surround, when the poster is whole — 21 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A 2:3 poster and a 0.46 screen are different shapes, so *whole* and
 * *full-bleed* are mutually exclusive and there is always room left over. This
 * is what goes in it: **the same picture continuing off the top and bottom
 * edges, out of focus.**
 *
 * It is the handset half of a pair. `film-screen.tsx` already fills that room
 * on a narrowed desk window with one cover-scaled copy at `blur-2xl` and 70%,
 * and this is that recipe with the fill changed — the blur and the opacity are
 * carried over deliberately rather than picked again, so the two surfaces are
 * out of focus by the same amount and the sharp poster stays the subject on
 * both. A cover-scaled copy cannot do the job here because the picture already
 * spans the width: there is nothing to crop *to*, only bands to continue into.
 *
 * Used twice — behind a flush `PosterReveal`, and behind the receded film
 * screen, which is the same picture in the same room.
 *
 * ⚠ **The centre tile has to land exactly under the sharp poster.** Off by a
 * pixel and the artwork is drawn twice slightly apart; the blur hides a great
 * deal but not a doubled edge. `align` is the element it must sit under, and it
 * is measured rather than assumed, because *contained, never enlarged* means a
 * poster can render narrower than the box it is centred in. Without an `align`
 * the fill is the clip's own width, which is right wherever the picture spans
 * the box by construction.
 */
export function PosterTiles({
  src,
  align,
  shown,
}: {
  src: string | null
  /** The sharp poster the centre tile must coincide with. */
  align?: React.RefObject<HTMLElement | null>
  /**
   * Painted only once the picture it repeats has arrived. **A background paints
   * in from the top exactly like an `<img>` does** — see `components/poster.tsx`
   * — so revealing this before the artwork would put the strips straight back
   * into the two bands, in the one place nobody would look for them.
   */
  shown: boolean
}) {
  const clipRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /*
      CSSOM rather than a `style` attribute: `proxy.ts` sets `style-src` with no
      `unsafe-inline` and the CSP drops server-rendered style attributes in
      production and nowhere else. The ban is on the attribute; assigning to
      `element.style` from an effect is unaffected. See eslint.config.mjs.
    */
    const paint = () => {
      const clip = clipRef.current
      const layer = layerRef.current
      if (!clip || !layer) return

      const width = align?.current?.getBoundingClientRect().width || clip.clientWidth
      layer.style.backgroundImage = src ? `url("${src}")` : ''
      layer.style.backgroundRepeat = 'repeat'
      layer.style.backgroundPosition = 'center'
      layer.style.backgroundSize = `${width}px auto`
    }

    paint()
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  })

  return (
    /*
      Two elements, and both are load bearing.

      The **clip** is the real box, and it is what `background-position: center`
      is centred against — indirectly, since the layer inside is centred on it.
      `overflow-hidden` is what lets the layer be bigger than the screen without
      the dialog growing a scrollbar around it.

      The **layer** overhangs by 8rem on every side, for the reason
      `film-screen.tsx` gives its `scale-110`: a blur samples past the element's
      edges, where there is nothing, so an exactly-sized copy fades out at all
      four sides and reads as a vignette. 8rem is `blur-2xl`'s own radius three
      times over, which is where a Gaussian has nothing left to give — not a
      number tuned against a screenshot.

      ⚠ **The overhang is symmetric, and it must stay symmetric.** It is what
      keeps the layer's centre on the clip's centre, which is what keeps the
      centre tile under the poster. `scale-110` would do the same job and is the
      wrong tool here: scaling resizes the tiles with it, and the tile size is
      the one thing that has to agree with something else.
    */
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" ref={clipRef}>
      <div
        ref={layerRef}
        className={`absolute -inset-32 blur-2xl transition-opacity duration-200 ${
          shown ? 'opacity-70' : 'opacity-0'
        }`}
      />
    </div>
  )
}
