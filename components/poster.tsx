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
 * middle and keeps type nobody can read at 32px. Anchoring to the top keeps the
 * face or the key image, which is the only thing that makes a thumbnail this
 * small worth having.
 *
 * The thumbnail fetches `w154` and the expanded view `original`. Sizes and the
 * arithmetic behind them are in `lib/posters.ts`.
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousThemeColor = useRef<string | null>(null)

  /*
    iOS tints the status-bar strip from the `theme-color` meta, which is
    `#0e0e10` (app/layout.tsx). Without this the top ~50px of the screen stays
    matte black while the rest of the expanded view is true black — a visible
    seam exactly where the poster is trying to have no edge.

    The previous value is read rather than hardcoded, so the token stays defined
    in one place and restoring cannot drift from it.
  */
  function setThemeColor(value: string) {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', value)
  }

  function open() {
    const meta = document.querySelector('meta[name="theme-color"]')
    previousThemeColor.current = meta?.getAttribute('content') ?? null
    setThemeColor('#000000')
    dialogRef.current?.showModal()
  }

  /*
    Fires for every route out — the click handler, Escape, and the back gesture —
    because `close` is a native dialog event rather than something we dispatch.
  */
  function restoreThemeColor() {
    if (previousThemeColor.current) setThemeColor(previousThemeColor.current)
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

  const large = posterUrl(posterPath, 'original')
  if (!expandable || !large || !title) return thumbnail

  /*
    Tap to see it properly.

    §2 keeps imagery to poster thumbnails, and a full-size view sits at the edge
    of that — recorded as a judgement call rather than smuggled in. What makes it
    defensible: the thumbnail is 32px because we shrank it three times, and at
    that size you cannot tell what you are looking at. The affordance is a
    consequence of that decision, not new appetite for pictures. No new data, no
    new source, the same poster.

    Native <dialog> rather than a hand-rolled overlay: showModal() brings focus
    trapping, Escape to close, inertness of the page behind, and a ::backdrop —
    all of which a div would have to reimplement, usually badly.
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
        // Anywhere closes it. There is nothing to do here but look and leave, so
        // hunting for a close button would be the only difficult part.
        onClick={() => dialogRef.current?.close()}
        onClose={restoreThemeColor}
        /*
          True black, not the app's `--color-bg`. §11's matte black is `#0e0e10`
          and is the right ground for type; this is the one surface in the
          product that is not type, and a poster wants nothing behind it at all.
          Deliberately off-palette, and only here.
        */
        className="bg-transparent backdrop:bg-black m-auto max-h-[85dvh] max-w-[90vw] p-0"
      >
        <Image
          src={large}
          alt={`Poster for ${title}`}
          width={2000}
          height={3000}
          className="h-auto max-h-[85dvh] w-auto max-w-full rounded-md object-contain"
        />
      </dialog>
    </>
  )
}
