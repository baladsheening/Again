'use client'

import Image from 'next/image'
import { useRef } from 'react'

import { posterUrl } from '@/lib/posters'

/**
 * Straight from TMDB's CDN — §3 forbids proxying images through the app, and
 * `images.unoptimized` in next.config.ts stops `next/image` routing them via
 * `/_next/image`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Where posters live, as of 9 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Not in any list.** The lists are type alone. A 32px thumbnail beside every
 * row was too small to recognise a film by and cropped square so it was not
 * even poster-shaped — decoration that failed at decorating, on the one screen
 * §11 wants type to carry.
 *
 * They survive in exactly two places, and both are functional rather than
 * decorative:
 *
 *  - **`Poster`** — the thumbnail, in the search dropdown and the intent sheet.
 *    Here it is doing a job nothing else can: telling two films with the same
 *    title apart at the moment you are choosing between them.
 *  - **`PosterReveal`** — wraps a title so tapping it opens the artwork
 *    full-bleed on black. The whole of the artwork, at the largest size TMDB
 *    has, once you have asked for it.
 *
 * That is the trade the redesign made: no poster anywhere you did not ask for
 * one, and a real poster when you did, instead of a thumbnail everywhere that
 * was neither.
 *
 * Square rather than 2:3 because poster-shaped *reads* as a poster at thumbnail
 * size; `object-top` because a film poster puts its subject in the upper half
 * and its billing block along the bottom.
 *
 * The thumbnail fetches `w154` and the expanded view `original`, which is the
 * largest TMDB has. Sizes and the arithmetic are in `lib/posters.ts`.
 */
export function Poster({ posterPath }: { posterPath: string | null }) {
  const src = posterUrl(posterPath)

  if (!src) {
    return (
      <div
        aria-hidden
        className="bg-surface border-rule size-8 shrink-0 rounded-md border"
      />
    )
  }

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      className="bg-surface size-8 shrink-0 rounded-md object-cover object-top"
      // Decorative: the title next to it is the accessible name.
      aria-hidden
    />
  )
}

/**
 * Tap the title, see the poster. Tap anywhere, close it — that is the whole
 * interaction. Pinch-zoom, double-tap zoom, panning and rubber banding were all
 * built and all removed on 8 August; see docs/decisions.md.
 *
 * Renders its children unwrapped when there is no artwork, so a film TMDB has
 * no poster for is a plain title rather than a button that opens nothing.
 */
export function PosterReveal({
  posterPath,
  title,
  className,
  children,
}: {
  posterPath: string | null
  title: string
  className?: string
  children: React.ReactNode
}) {
  const large = posterUrl(posterPath, 'original')
  const dialogRef = useRef<HTMLDialogElement>(null)

  if (!large) return <>{children}</>

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`${title} — see the poster`}
        /*
          `text-left` because this is a paragraph of text inside a button, and
          `decoration-transparent` so the underline exists at rest and only
          takes colour on hover. Animating an underline in from nothing shifts
          nothing, but it does mean the affordance is invisible until you are
          already on it — this way the geometry is settled and only the ink
          arrives.
        */
        className={`decoration-rule hover:decoration-muted text-left underline decoration-1 underline-offset-[6px] transition-colors ${className ?? ''}`}
      >
        {children}
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
