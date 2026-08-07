import Image from 'next/image'

import { posterUrl } from '@/lib/posters'

/**
 * Straight from TMDB's CDN — §3 forbids proxying images through the app, and
 * `images.unoptimized` in next.config.ts stops `next/image` routing them via
 * `/_next/image`.
 *
 * §11 allows small poster thumbnails and no other imagery, so this is the only
 * picture in the product.
 */
export function Poster({ posterPath }: { posterPath: string | null }) {
  const src = posterUrl(posterPath)

  if (!src) {
    return (
      <div
        aria-hidden
        className="bg-surface border-rule h-[69px] w-[46px] shrink-0 rounded-sm border"
      />
    )
  }

  return (
    <Image
      src={src}
      alt=""
      width={46}
      height={69}
      className="bg-surface h-[69px] w-[46px] shrink-0 rounded-sm object-cover"
      // Decorative: the title next to it is the accessible name.
      aria-hidden
    />
  )
}
