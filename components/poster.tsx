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

/** Distance between the first two touches, for pinch. */
function spread(touches: TouchList) {
  const [a, b] = [touches[0]!, touches[1]!]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
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
  const previousThemeColor = useRef<string | null>(null)

  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 })

  /*
    Gesture bookkeeping. A ref rather than state: it changes on every touchmove
    and none of it should cause a render — only the resulting transform does.

    `moved` is what stops a pinch or a drag from also counting as the tap that
    closes the dialog. Without it, letting go after zooming in dismisses the
    thing you just zoomed into.
  */
  const gesture = useRef({
    mode: 'none' as 'none' | 'pinch' | 'pan',
    startSpread: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })

  /*
    Why this component does its own pinch-zoom at all.

    On iOS a pinch zooms the *visual viewport* — the whole page, with the dialog
    merely sitting on top of it. Closing then revealed the list behind still
    magnified. There is no way to put that back: `visualViewport.scale` is
    read-only, and the old `maximum-scale=1` meta trick has been ignored since
    iOS 10, when Apple deliberately stopped sites disabling zoom. An earlier
    commit tried it and it did nothing.

    So the page must never zoom in the first place. `touch-action: none` on the
    stage plus `preventDefault` on the gestures keeps the pinch inside this
    element — and having taken the gesture, we owe the user the zoom it was for.

    Listeners are attached by hand rather than through React's props because they
    must be `{ passive: false }`; a passive listener cannot preventDefault, and
    the browser would zoom the page anyway.
  */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    function onTouchStart(e: TouchEvent) {
      const g = gesture.current
      if (e.touches.length === 2) {
        g.mode = 'pinch'
        g.startSpread = spread(e.touches)
        g.startScale = zoom.scale
        g.originX = zoom.x
        g.originY = zoom.y
      } else if (e.touches.length === 1 && zoom.scale > 1) {
        g.mode = 'pan'
        g.startX = e.touches[0]!.clientX
        g.startY = e.touches[0]!.clientY
        g.originX = zoom.x
        g.originY = zoom.y
      } else {
        g.mode = 'none'
      }
      g.moved = false
    }

    function onTouchMove(e: TouchEvent) {
      const g = gesture.current
      if (g.mode === 'none') return
      e.preventDefault()
      g.moved = true

      if (g.mode === 'pinch' && e.touches.length === 2) {
        const next = Math.min(
          MAX_SCALE,
          Math.max(1, g.startScale * (spread(e.touches) / g.startSpread)),
        )
        setZoom({ scale: next, x: g.originX, y: g.originY })
        return
      }

      if (g.mode === 'pan' && e.touches.length === 1) {
        setZoom((z) => ({
          ...z,
          x: g.originX + (e.touches[0]!.clientX - g.startX),
          y: g.originY + (e.touches[0]!.clientY - g.startY),
        }))
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length > 0) return
      gesture.current.mode = 'none'
      // Back to rest if the pinch ended at or below 1 — otherwise the poster is
      // left fractionally offset with nothing to pan.
      setZoom((z) => (z.scale <= 1.01 ? { scale: 1, x: 0, y: 0 } : z))
    }

    // Safari's own gesture events fire alongside touch events; left alone they
    // zoom the page even when the touch handlers have preventDefaulted.
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
  }, [zoom.scale, zoom.x, zoom.y])

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

  function open() {
    previousThemeColor.current =
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute('content') ?? null
    setThemeColor('#000000')
    setZoom({ scale: 1, x: 0, y: 0 })
    dialogRef.current?.showModal()
  }

  /** Fires for every way out: the tap, Escape, and the back gesture. */
  function onDialogClose() {
    if (previousThemeColor.current) setThemeColor(previousThemeColor.current)
    setZoom({ scale: 1, x: 0, y: 0 })
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
          // A tap closes; a pinch or a drag does not. There is nothing to do here
          // but look and leave, so a close button would be the only hard part.
          onClick={() => {
            if (!gesture.current.moved) dialogRef.current?.close()
          }}
          className="flex h-full w-full touch-none items-center justify-center bg-black"
        >
          <Image
            src={large}
            alt={`Poster for ${title}`}
            width={2000}
            height={3000}
            draggable={false}
            style={{
              transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})`,
            }}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </dialog>
    </>
  )
}
