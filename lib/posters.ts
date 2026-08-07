/**
 * Poster URLs point at TMDB's CDN directly. §3: never proxy images through the
 * app — the egress is theirs, not ours, and `next/image` is set `unoptimized`
 * so it cannot quietly route them through `/_next/image`.
 *
 * Pure and client-safe: this builds a string, it does not fetch anything.
 */

const CDN = 'https://image.tmdb.org/t/p'

/** §11 allows small poster thumbnails and nothing more, so w92 is the size. */
export function posterUrl(posterPath: string | null, size: 'w92' | 'w154' = 'w92') {
  if (!posterPath) return null
  return `${CDN}/${size}${posterPath}`
}
