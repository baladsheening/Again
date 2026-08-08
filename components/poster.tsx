import Image from 'next/image'

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
 * `w92` is TMDB's smallest poster and still covers 32px at 2x, so nothing
 * changes about what is fetched.
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
