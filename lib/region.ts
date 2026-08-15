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
