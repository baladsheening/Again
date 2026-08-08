'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { posterUrl } from '@/lib/posters'

/**
 * Straight from TMDB's CDN — §3 forbids proxying images through the app, and
 * `images.unoptimized` in next.config.ts stops `next/image` routing them via
 * `/_next/image`.
 *
 * §11 allows small poster thumbnails and no other imagery, so this is the only
 * picture in the product.
 *
 * **A 32px rounded square**, arrived at from 46×69 in three steps. At the
 * original size the poster was taller than the text beside it and the eye went
 * to the artwork first, which inverts §11 — type is the design, and the poster
 * exists to help you recognise a title you already know, not to sell it to you.
 *
 * Square rather than 2:3 because poster-shaped *reads* as a poster: it is the
 * proportion of a thing meant to be looked at. A square at this size reads as a
 * marker beside a line of text, which is the job.
 *
 * The source is 2:3, so it has to be cropped. `object-top` rather than the
 * default centre: a film poster puts its subject in the upper half and its
 * billing block along the bottom, so a centred crop takes a slice through the
 * middle and keeps type nobody can read at 32px.
 *
 * The thumbnail fetches `w154` and the expanded view `original`. Sizes and the
 * arithmetic behind them are in `lib/posters.ts`.
 */

const MAX_SCALE = 4
const SETTLE_MS = 300

/** Distance between the first two touches, for pinch. */
function spread(touches: TouchList) {
  const [a, b] = [touches[0]!, touches[1]!]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/**
 * Apple's rubber band, as used by every scroll view on the platform:
 * `(1 − 1/(x·c/d + 1))·d`, with `c = 0.55`.
 *
 * Past the boundary the finger keeps moving and the image keeps following, but
 * by ever less — the resistance grows with the overshoot and the result
 * asymptotes at the container's own dimension, so it can never be dragged into
 * nowhere. Below the boundary it is the identity function and costs nothing.
 */
function rubber(offset: number, limit: number, dimension: number) {
  const over = Math.abs(offset) - limit
  if (over <= 0) return offset
  const damped = (1 - 1 / ((over * 0.55) / dimension + 1)) * dimension
  return Math.sign(offset) * (limit + damped)
}

export function Poster({
  posterPath,
  title,
  expandable = false,
}: {
  posterPath: string | null
  /** Names the poster for a reader. Required to make it expandable. */
  title?: string
  expandable?: boolean
}) {
  const src = posterUrl(posterPath)
  const large = posterUrl(posterPath, 'original')

  const dialogRef = useRef<HTMLDialogElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const previousThemeColor = useRef<string | null>(null)

  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 })
  /** Turns the transition on only for the spring back, never during a drag. */
  const [settling, setSettling] = useState(false)

  /*
    The live transform. A ref rather than state so the touch handlers can read
    the current value without the effect re-subscribing on every frame; `setZoom`
    exists purely to render it.
  */
  const zoomRef = useRef({ scale: 1, x: 0, y: 0 })

  const gesture = useRef({
    mode: 'none' as 'none' | 'pinch' | 'pan',
    startSpread: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    /** Stops a pinch or a drag from also counting as the tap that closes. */
    moved: false,
  })

  /*
    Why this component does its own pinch-zoom at all.

    On iOS a pinch zooms the *visual viewport* — the whole page, with the dialog
    merely sitting on top of it. Closing then revealed the list behind still
    magnified, and there is no way to put that back: `visualViewport.scale` is
    read-only, and the `maximum-scale=1` meta trick has been ignored since iOS
    10, when Apple deliberately stopped sites disabling zoom.

    So the page must never zoom in the first place. `touch-action: none` plus
    `preventDefault` keeps the gesture inside this element — and having taken it,
    the view owes the user the zoom it was for.

    Listeners are attached by hand rather than through React's props because they
    need `{ passive: false }`; a passive listener cannot preventDefault, and the
    browser would zoom the page regardless.
  */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    /** How far the image may be moved before it is showing its own edge. */
    function limits() {
      const image = imageRef.current
      if (!image || !stage) return { x: 0, y: 0 }
      const { scale } = zoomRef.current
      return {
        x: Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2),
        y: Math.max(0, (image.offsetHeight * scale - stage.clientHeight) / 2),
      }
    }

    function apply(next: { scale: number; x: number; y: number }) {
      zoomRef.current = next
      setZoom(next)
    }

    function onTouchStart(e: TouchEvent) {
      const g = gesture.current
      const z = zoomRef.current
      setSettling(false)

      if (e.touches.length === 2) {
        g.mode = 'pinch'
        g.startSpread = spread(e.touches)
        g.startScale = z.scale
      } else if (e.touches.length === 1 && z.scale > 1) {
        g.mode = 'pan'
        g.startX = e.touches[0]!.clientX
        g.startY = e.touches[0]!.clientY
      } else {
        g.mode = 'none'
      }

      g.originX = z.x
      g.originY = z.y
      g.moved = false
    }

    function onTouchMove(e: TouchEvent) {
      const g = gesture.current
      if (g.mode === 'none' || !stage) return
      e.preventDefault()
      g.moved = true

      if (g.mode === 'pinch' && e.touches.length === 2) {
        const scale = clamp(
          g.startScale * (spread(e.touches) / g.startSpread),
          1,
          MAX_SCALE,
        )
        apply({ scale, x: g.originX, y: g.originY })
        return
      }

      if (g.mode === 'pan' && e.touches.length === 1) {
        const bound = limits()
        apply({
          ...zoomRef.current,
          x: rubber(
            g.originX + (e.touches[0]!.clientX - g.startX),
            bound.x,
            stage.clientWidth,
          ),
          y: rubber(
            g.originY + (e.touches[0]!.clientY - g.startY),
            bound.y,
            stage.clientHeight,
          ),
        })
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length > 0) return
      gesture.current.mode = 'none'

      // Spring back to whatever is legal now — which also covers a pinch that
      // ended smaller, since shrinking tightens the bounds the pan sits inside.
      const z = zoomRef.current
      const scale = z.scale <= 1.01 ? 1 : z.scale
      zoomRef.current = { ...z, scale }
      const bound = limits()
      const settled = {
        scale,
        x: clamp(z.x, -bound.x, bound.x),
        y: clamp(z.y, -bound.y, bound.y),
      }

      if (settled.x === z.x && settled.y === z.y && settled.scale === z.scale) {
        zoomRef.current = settled
        return
      }

      setSettling(true)
      apply(settled)
      setTimeout(() => setSettling(false), SETTLE_MS)
    }

    // Safari's own gesture events fire alongside touch events; left alone they
    // zoom the page even once the touch handlers have preventDefaulted.
    function blockGesture(e: Event) {
      e.preventDefault()
    }

    const opts = { passive: false } as const
    stage.addEventListener('touchstart', onTouchStart, opts)
    stage.addEventListener('touchmove', onTouchMove, opts)
    stage.addEventListener('touchend', onTouchEnd, opts)
    stage.addEventListener('gesturestart', blockGesture, opts)
    stage.addEventListener('gesturechange', blockGesture, opts)

    return () => {
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      stage.removeEventListener('gesturestart', blockGesture)
      stage.removeEventListener('gesturechange', blockGesture)
    }
  }, [])

  /*
    iOS tints the status-bar strip from the `theme-color` meta, which is
    `#0e0e10`. Without this the top of the screen stays matte black while the
    rest of the expanded view is true black — a seam exactly where the poster is
    trying not to have an edge. The previous value is read rather than hardcoded,
    so the token stays defined only in app/layout.tsx.
  */
  function setThemeColor(value: string) {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', value)
  }

  function rest() {
    zoomRef.current = { scale: 1, x: 0, y: 0 }
    setZoom(zoomRef.current)
    setSettling(false)
  }

  function open() {
    previousThemeColor.current =
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute('content') ?? null
    setThemeColor('#000000')
    rest()
    dialogRef.current?.showModal()
  }

  /** Fires for every way out: the tap, Escape, and the back gesture. */
  function onDialogClose() {
    if (previousThemeColor.current) setThemeColor(previousThemeColor.current)
    rest()
  }

  if (!src) {
    return (
      <div
        aria-hidden
        className="bg-surface border-rule size-8 shrink-0 rounded-md border"
      />
    )
  }

  const thumbnail = (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      className="bg-surface size-8 shrink-0 rounded-md object-cover object-top"
      // Decorative in the plain case: the title next to it is the accessible
      // name. When expandable, the button around it carries the label instead.
      aria-hidden
    />
  )

  if (!expandable || !large || !title) return thumbnail

  /*
    §2 keeps imagery to poster thumbnails, and a full-size view sits at the edge
    of that — a judgement call recorded rather than smuggled in. The thumbnail is
    32px because it was shrunk three times, and at that size you cannot tell what
    you are looking at; the affordance is a consequence of that, not new appetite
    for pictures. No new data, no new source, the same poster.

    Native <dialog> rather than a hand-rolled overlay: showModal() brings focus
    trapping, Escape to close, inertness of the page behind, and a ::backdrop.
  */
  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`Poster for ${title}`}
        className="shrink-0 rounded-md"
      >
        {thumbnail}
      </button>

      <dialog
        ref={dialogRef}
        onClose={onDialogClose}
        /*
          True black, not `--color-bg`. §11's matte black is the right ground for
          type; this is the one surface in the product that is not type, and a
          poster wants nothing behind it. Deliberately off-palette, only here.

          Full-bleed rather than a centred box, so the black reaches every edge
          and there is nowhere to tap that is not the poster or its ground.
        */
        className="bg-transparent backdrop:bg-black m-0 h-full max-h-none w-full max-w-none p-0"
      >
        <div
          ref={stageRef}
          onClick={() => {
            if (!gesture.current.moved) dialogRef.current?.close()
          }}
          className="flex h-full w-full touch-none items-center justify-center overflow-hidden bg-black"
        >
          <Image
            ref={imageRef}
            src={large}
            alt={`Poster for ${title}`}
            width={2000}
            height={3000}
            draggable={false}
            style={{
              transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`,
              transition: settling
                ? `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : undefined,
            }}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </dialog>
    </>
  )
}
