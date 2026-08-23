import 'server-only'

import { headers } from 'next/headers'
import { z } from 'zod'

/**
 * Where the viewer is, as an ISO 3166-1 alpha-2 country code, or `null` when
 * nothing reliable says.
 *
 * One consumer: `inCinemas()`, which asks TMDB to filter release dates to a
 * country. **"In cinemas" is a claim about a place**, and until 15 August it was
 * a claim about the United States made to everybody — TMDB defaults there when
 * no region is given, so a London wall opened on American release dates that run
 * weeks or months out of step with the ones down the road.
 *
 * **Read off the request rather than asked for.** The alternative is a setting,
 * which costs a column, a screen and a question put to somebody who opened the
 * app to look at posters. The user-context model in docs/decisions.md is
 * deliberately deferred, and this needs none of it: the header is already here.
 *
 * ⚠ **It is a guess, and the blast radius is one wall.** An IP is wrong for a
 * traveller and for anyone behind a VPN. Nothing is stored, nothing branches on
 * it, no query filters by it, and the worst case is seeing another country's
 * release dates — which is precisely what everyone saw before this existed. If
 * it is ever worth being right rather than usually right, that is a setting, and
 * it belongs with the rest of `/settings`.
 *
 * ⚠ **Validated because it is interpolated into an upstream URL** — §10 wants
 * Zod at every boundary and this is one. On Vercel the header is written at the
 * edge and an inbound copy is overwritten, so a client cannot forge it; anywhere
 * else it could, and two uppercase letters is the whole of what may pass.
 *
 * ⚠ **Absent in development**, where no edge sets it, so the local wall is the
 * unregioned one. There is deliberately no env override: a second way to set
 * this is a second thing that can be wrong in production while looking right on
 * a desk.
 */
const country = z.string().regex(/^[A-Z]{2}$/)

export async function viewerRegion(): Promise<string | null> {
  const parsed = country.safeParse((await headers()).get('x-vercel-ip-country'))
  return parsed.success ? parsed.data : null
}

/**
 * The viewer's timezone, as an IANA name, or `null` when nothing reliable says.
 *
 * One consumer: the day stamps on the capture page. **The day a line was written
 * is a claim about a place**, and the server that renders it is in UTC while the
 * handset reading it is not — so without this, anything captured after 23:00
 * British Summer Time is filed under yesterday.
 *
 * Read off the request rather than asked for, exactly like `viewerRegion` above,
 * and for the same reason: the header is already here, and the alternative is a
 * setting nobody opened the app to fill in. The browser knows better —
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` is exact — and it is
 * deliberately not used, because a page whose groups are computed on the client
 * and on the server disagrees with itself at midnight. See `lib/day.ts`.
 *
 * ⚠ **Validated because it is handed to `Intl`**, which throws `RangeError` on
 * an unknown zone and would take the whole page down with it. §10 wants Zod at
 * every boundary and this is one. On Vercel the header is written at the edge
 * and an inbound copy is overwritten, so a client cannot forge it; anywhere else
 * it could, and the shape below is the whole of what may pass.
 *
 * ⚠ **Absent in development**, where no edge sets it — so `null`, and `Intl`
 * falls back to the machine's own zone, which on a laptop is the right answer
 * anyway. The failure this cannot see is therefore production-only, which is
 * what the header being absent locally always costs.
 */
const timeZone = z.string().regex(/^[A-Za-z_+-]+(?:\/[A-Za-z_0-9+-]+){0,2}$/)

export async function viewerTimeZone(): Promise<string | null> {
  const parsed = timeZone.safeParse((await headers()).get('x-vercel-ip-timezone'))
  if (!parsed.success) return null

  /*
    Zod says it has the shape of a zone name; only `Intl` knows whether it is
    one. A bad value here is a blank page rather than a wrong date, so it is
    worth the try/catch that `viewerRegion` does not need.
  */
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: parsed.data })
    return parsed.data
  } catch {
    return null
  }
}
