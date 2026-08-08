'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { posterUrl } from '@/lib/posters'

/**
 * Straight from TMDB's CDN — §3 forbids proxying images through the app, and
 * `images.unoptimized` in next.config.ts stops `next/image` routing them via
 * `/_next/image`.
 *
 * §11 allows small poster thumbnails and no other imagery, so this is the only
 * picture in the product.
 *
 * **A 32px rounded square.** At the original 46×69 the poster was taller than
 * the text beside it and the eye went to the artwork first, which inverts §11 —
 * type is the design, and the poster exists to help you recognise a title you
 * already know. Square rather than 2:3 because poster-shaped *reads* as a
 * poster; `object-top` because a film poster puts its subject in the upper half
 * and its billing block along the bottom.
 *
 * The thumbnail fetches `w154` and the expanded view `original`. Sizes and the
 * arithmetic behind them are in `lib/posters.ts`.
 */

/** How long a tap waits to find out whether it was the first half of a double. */
const DOUBLE_TAP_MS = 260
/** Two taps count as one gesture only if they land near each other. */
const DOUBLE_TAP_SLOP = 32
const SETTLE_MS = 300
const SETTLE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/**
 * Apple's rubber band, as used by every scroll view on the platform:
 * `(1 − 1/(x·c/d + 1))·d`, with `c = 0.55`.
 *
 * Past the edge the finger keeps moving and the image keeps following, but by
 * ever less — resistance grows with the overshoot and the result asymptotes at
 * the container's own dimension, so it can never be dragged into nowhere. Inside
 * the edge it is the identity function and costs nothing.
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

  /*
    The transform lives in a ref and is painted straight onto the element. No
    component state is involved in a drag at all: a React render per touchmove is
    sixty reconciliations a second to set one style property, and it is the
    difference between the image tracking your finger and lagging behind it.
  */
  const view = useRef({ scale: 1, x: 0, y: 0 })

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const drag = { active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false }
    const tap = { last: 0, x: 0, y: 0, timer: 0 as number | ReturnType<typeof setTimeout> }

    function paint(transition = false) {
      const image = imageRef.current
      if (!image) return
      const { scale, x, y } = view.current
      image.style.transition = transition ? `transform ${SETTLE_MS}ms ${SETTLE_EASE}` : 'none'
      image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    }

    /** How far the image may travel before it shows its own edge. */
    function limits() {
      const image = imageRef.current
      if (!image || !stage) return { x: 0, y: 0 }
      const { scale } = view.current
      return {
        x: Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2),
        y: Math.max(0, (image.offsetHeight * scale - stage.clientHeight) / 2),
      }
    }

    /*
      What "full size" means, computed rather than picked.

      The larger of two things: the scale that fills the screen edge to edge, and
      the scale at which one source pixel lands on one device pixel. The first
      removes the letterboxing you can see; the second is the point past which
      the poster is being enlarged rather than revealed, and beyond it a zoom
      only makes the image softer — which was the whole complaint about w500.

      Capped at 3 so a very large source cannot zoom absurdly, floored at 1.4 so
      the gesture always does something visible.
    */
    function fullScale() {
      const image = imageRef.current
      if (!image || !stage) return 2
      const cover = Math.max(
        stage.clientWidth / image.offsetWidth,
        stage.clientHeight / image.offsetHeight,
      )
      const oneToOne =
        image.naturalWidth / (image.offsetWidth * (window.devicePixelRatio || 1))
      return clamp(Math.max(cover, oneToOne), 1.4, 3)
    }

    function settle() {
      const bound = limits()
      view.current.x = clamp(view.current.x, -bound.x, bound.x)
      view.current.y = clamp(view.current.y, -bound.y, bound.y)
      paint(true)
    }

    function toggleZoom() {
      view.current =
        view.current.scale > 1
          ? { scale: 1, x: 0, y: 0 }
          : { scale: fullScale(), x: 0, y: 0 }
      paint(true)
    }

    function onTouchStart(e: TouchEvent) {
      /*
        Two fingers do nothing but get swallowed. Pinch is deliberately absent —
        and it still has to be prevented, because an unhandled pinch zooms the
        *page*, and iOS gives no way to put page zoom back afterwards.
      */
      if (e.touches.length !== 1) {
        e.preventDefault()
        drag.active = false
        return
      }

      drag.active = view.current.scale > 1
      drag.startX = e.touches[0]!.clientX
      drag.startY = e.touches[0]!.clientY
      drag.originX = view.current.x
      drag.originY = view.current.y
      drag.moved = false
      if (drag.active) paint(false) // cancel any spring mid-flight
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (!drag.active || e.touches.length !== 1 || !stage) return

      const dx = e.touches[0]!.clientX - drag.startX
      const dy = e.touches[0]!.clientY - drag.startY
      if (Math.hypot(dx, dy) > 4) drag.moved = true

      const bound = limits()
      view.current.x = rubber(drag.originX + dx, bound.x, stage.clientWidth)
      view.current.y = rubber(drag.originY + dy, bound.y, stage.clientHeight)
      paint(false)
    }

    function onTouchEnd(e: TouchEvent) {
      /*
        Stops the browser synthesising `click` and `dblclick` from this touch.
        Without it every tap schedules a close twice — once here and once from
        the mouse fallback below — and a double-tap cancels only one of them, so
        the poster zooms and then dismisses itself.
      */
      e.preventDefault()
      if (e.touches.length > 0) return

      if (drag.moved) {
        drag.active = false
        settle()
        return
      }
      drag.active = false

      /*
        A tap. Whether it closes or zooms cannot be known until the double-tap
        window has passed, so the close is scheduled and cancelled by a second
        tap. That puts 260ms on dismissing the poster, which is the price of
        double-tap existing at all.
      */
      const touch = e.changedTouches[0]
      if (!touch) return
      const now = Date.now()
      const near =
        Math.hypot(touch.clientX - tap.x, touch.clientY - tap.y) < DOUBLE_TAP_SLOP

      if (now - tap.last < DOUBLE_TAP_MS && near) {
        clearTimeout(tap.timer)
        tap.last = 0
        toggleZoom()
        return
      }

      tap.last = now
      tap.x = touch.clientX
      tap.y = touch.clientY
      tap.timer = setTimeout(() => dialogRef.current?.close(), DOUBLE_TAP_MS)
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

    // A pointer device has no touch events: click closes, double-click zooms.
    function onDoubleClick() {
      clearTimeout(tap.timer)
      toggleZoom()
    }
    function onClick() {
      tap.timer = setTimeout(() => dialogRef.current?.close(), DOUBLE_TAP_MS)
    }
    stage.addEventListener('dblclick', onDoubleClick)
    stage.addEventListener('click', onClick)

    /** Reset when the dialog closes, so it always reopens at rest. */
    function onClose() {
      clearTimeout(tap.timer)
      view.current = { scale: 1, x: 0, y: 0 }
      paint(false)
    }
    const dialog = dialogRef.current
    dialog?.addEventListener('close', onClose)

    return () => {
      clearTimeout(tap.timer)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      stage.removeEventListener('gesturestart', blockGesture)
      stage.removeEventListener('gesturechange', blockGesture)
      stage.removeEventListener('dblclick', onDoubleClick)
      stage.removeEventListener('click', onClick)
      dialog?.removeEventListener('close', onClose)
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value)
  }

  function open() {
    previousThemeColor.current =
      document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null
    setThemeColor('#000000')
    dialogRef.current?.showModal()
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
        onClose={() => {
          if (previousThemeColor.current) setThemeColor(previousThemeColor.current)
        }}
        /*
          True black, not `--color-bg`. §11's matte black is the right ground for
          type; this is the one surface in the product that is not type. Full
          bleed, so black reaches every edge and there is nowhere to tap that is
          not the poster or its ground.
        */
        className="bg-transparent backdrop:bg-black m-0 h-full max-h-none w-full max-w-none p-0"
      >
        <div
          ref={stageRef}
          className="flex h-full w-full touch-none items-center justify-center overflow-hidden bg-black"
        >
          <Image
            ref={imageRef}
            src={large}
            alt={`Poster for ${title}`}
            width={2000}
            height={3000}
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </dialog>
    </>
  )
}
