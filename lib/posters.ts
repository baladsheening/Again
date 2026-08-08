/**
 * Poster URLs point at TMDB's CDN directly. §3: never proxy images through the
 * app — the egress is theirs, not ours, and `next/image` is set `unoptimized`
 * so it cannot quietly route them through `/_next/image`.
 *
 * Pure and client-safe: this builds a string, it does not fetch anything.
 */

const CDN = 'https://image.tmdb.org/t/p'

/**
 * `w92` is the default because §11 allows small poster thumbnails and nothing
 * more, and 92px covers the 32px square at 2x.
 *
 * `w500` exists for one purpose: the tap-to-expand view, added 8 August. Still
 * TMDB's CDN, still no proxy, and deliberately not `original` — a poster at full
 * resolution is a several-megabyte download to look at something on a phone.
 */
export function posterUrl(
  posterPath: string | null,
  size: 'w92' | 'w154' | 'w500' = 'w92',
) {
  if (!posterPath) return null
  return `${CDN}/${size}${posterPath}`
}
