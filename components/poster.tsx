'use client'

import Image from 'next/image'
import { useRef } from 'react'

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
 * Tapping one opens it full-bleed on black. Tap anywhere to close, and that is
 * the whole interaction — pinch-zoom, double-tap zoom, panning and rubber
 * banding were all built and all removed on 8 August. See docs/decisions.md.
 *
 * The thumbnail fetches `w154` and the expanded view `original`, which is the
 * largest TMDB has. Sizes and the arithmetic are in `lib/posters.ts`.
 */
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

  /*
    This used to swap `theme-color` to #000 on open and back on close, because
    the status-bar strip stayed matte black while the view behind it was true
    black. The app's own background became true black on 8 August, so the swap
    became a no-op and went with it.
  */
  function open() {
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
        /*
          `backdrop:bg-black` is now the same value as `--color-bg`, and stays
          spelled out rather than switched to the token: this surface is black
          because a poster wants nothing behind it, not because it inherits the
          app's ground. If the ground ever moves off true black, this should not
          follow it.

          Full bleed, so black reaches every edge and there is nowhere to tap
          that is not the poster or its ground.
        */
        className="bg-transparent backdrop:bg-black m-0 h-full max-h-none w-full max-w-none p-0"
      >
        <div
          onClick={() => dialogRef.current?.close()}
          /*
            `touch-none` is the one piece of the zoom work worth keeping, and it
            is a class rather than code. It stops the browser doing its own
            pinch and double-tap zoom on this element — which matters because an
            unhandled pinch zooms the *page*, and iOS offers no way to put page
            zoom back: `visualViewport.scale` is read-only and the
            `maximum-scale` meta has been ignored since iOS 10.

            Without it, pinching the poster and closing left the list behind
            magnified with no way back short of reloading.
          */
          className="flex h-full w-full touch-none items-center justify-center bg-black"
        >
          <Image
            src={large}
            alt={`Poster for ${title}`}
            width={2000}
            height={3000}
            draggable={false}
            // Contained, never enlarged: a 2000px source shown across ~390 CSS
            // px is a downscale, which is the sharpest a screen can render it.
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </dialog>
    </>
  )
}
