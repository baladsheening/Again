/**
 * Poster URLs point at TMDB's CDN directly. §3: never proxy images through the
 * app — the egress is theirs, not ours, and `next/image` is set `unoptimized`
 * so it cannot quietly route them through `/_next/image`.
 *
 * Pure and client-safe: this builds a string, it does not fetch anything.
 */

const CDN = 'https://image.tmdb.org/t/p'

/**
 * `w154` is the thumbnail. It was `w92` until 8 August, on the arithmetic that
 * 92 covers a 32px square at 2x — which is true, and phones are not 2x. An
 * iPhone 12 is 3x, so the square wants 96 real pixels, and `object-cover`
 * cropping a 92×138 source to a square scales it *up* by 4% to get there. The
 * thumbnail was being enlarged, which is why it looked soft on the one screen
 * that matters most.
 *
 * `w154` gives 154×231, a downscale rather than an upscale, with headroom for
 * whatever pixel ratio comes next.
 *
 * `original` is the tap-to-expand view. It went `w500` → `w780` → here, and the
 * first two were soft for the same reason: the size was picked against the
 * download rather than against the size it renders at. The expanded poster fills
 * ~350 CSS px on a phone, and a 3x screen wants ~1050 real pixels for that.
 *
 * **Full resolution costs this project nothing**, which is what settled it:
 *
 * - **No database growth.** Postgres stores `poster_path`, a ~32-character
 *   string in `items.metadata`. No image byte has ever been in the database.
 * - **No egress of ours.** The browser fetches from TMDB's CDN directly. That is
 *   §3's no-proxy rule, held up by `images.unoptimized` in next.config.ts —
 *   without it `next/image` would route every poster through `/_next/image` and
 *   the bandwidth would become the app's.
 *
 * The cost falls on whoever taps it: measured originals run 0.8–1.5MB. That is
 * a real amount on mobile data, and it is spent only on a deliberate tap.
 */
export function posterUrl(
  posterPath: string | null,
  size: 'w92' | 'w154' | 'original' = 'w154',
) {
  if (!posterPath) return null
  return `${CDN}/${size}${posterPath}`
}
