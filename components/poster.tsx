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
 * **32×48, down from 46×69.** At the larger size it was taller than the text
 * beside it and the eye went to the artwork first, which inverts §11 — type is
 * the design, and the poster is there to help you recognise a title you already
 * know, not to sell it to you. The 2:3 ratio is fixed by the source material;
 * `w92` still covers 32px at 2x, so nothing changes about what is fetched.
 */
export function Poster({ posterPath }: { posterPath: string | null }) {
  const src = posterUrl(posterPath)

  if (!src) {
    return (
      <div
        aria-hidden
        className="bg-surface border-rule h-12 w-8 shrink-0 rounded-sm border"
      />
    )
  }

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={48}
      className="bg-surface h-12 w-8 shrink-0 rounded-sm object-cover"
      // Decorative: the title next to it is the accessible name.
      aria-hidden
    />
  )
}
