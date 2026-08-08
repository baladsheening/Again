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
 * `w780` is the tap-to-expand view. It was `w500` for about ten minutes and
 * looked soft, because 500 was chosen against the file size rather than against
 * the size it renders at: the expanded poster fills ~350 CSS px on a phone, and
 * a 3x screen wants ~1050 real pixels for that. 500 was being stretched to
 * double. A retina laptop asked for ~934 and got the same 500.
 *
 * `w780` is TMDB's largest fixed poster width, so `original` is the only step
 * up — and that is the full production file, often several megabytes, which is a
 * lot to glance at something on mobile data. Still their CDN, still no proxy.
 */
export function posterUrl(
  posterPath: string | null,
  size: 'w92' | 'w154' | 'w780' = 'w92',
) {
  if (!posterPath) return null
  return `${CDN}/${size}${posterPath}`
}
