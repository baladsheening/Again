import { redirect } from 'next/navigation'

import { PageScreen, type PageLineView } from '@/components/page-screen'
import { getMyProfile, getSessionUser, listMyPage, UNDO_WINDOW_MS } from '@/lib/db'
import { dayStamper } from '@/lib/day'
import { viewerTimeZone } from '@/lib/region'

/**
 * Home: **the page.**
 *
 * `/` was the capture box alone for about an hour on 9 August, then the poster
 * wall for a fortnight, and it is the record itself now — a blank page, one line
 * per capture, the caret under the bar and the record newest-first beneath it.
 * See `docs/re-direction/phase-1-capture.md` and `components/page-screen.tsx`.
 *
 * **Four routes went away with it** — `/wants`, `/go-back-tos`, `/fixtures` and
 * `/archive`. Everything active is here; everything settled is behind the tray.
 *
 * This component does three things and stops: the read, the stamps, and the
 * seed. The page owns its list from the first paint on, because Return has to
 * land in under a frame rather than after a round trip.
 */
export default async function HomePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  /*
    §10: paginate every list. The read runs newest-first and is **used**
    newest-first: the page puts the caret at the top and the record under it, so
    the order the query returns is the order the page wants and there is nothing
    left to reverse. An ascending `limit` would still be wrong — it would hand
    back the fifty oldest lines somebody ever wrote.

    ⚠ **Earlier lines are not reachable yet, and that is a stated gap.** Fifty is
    roughly a month of this, so it is not a fault to be found on the handset this
    week; what closes it is the tray taking settled lines off the page (already
    true), search (Phase 1, not built), and an *Earlier* control at the head of
    the page, which is one more `offset` and no new read.
  */
  const rows = await listMyPage(sessionUser)

  /*
    The stamps are computed here and only here. Grouping by day depends on a
    timezone, and the server's and the browser's are not the same — a page that
    formatted on both sides would disagree about how many groups there are for
    anything written after 23:00 local, which is a structural hydration mismatch
    in a list. See `lib/day.ts`.
  */
  const { todayKey, stamp } = dayStamper(new Date(), (await viewerTimeZone()) ?? undefined)

  const lines: PageLineView[] = rows.map((row) => {
    const day = stamp(row.createdAt)
    return {
      id: row.id,
      text: row.text,
      state: row.state,
      year: row.year,
      day: day.key,
      dayLabel: day.label,
    }
  })

  return <PageScreen lines={lines} todayKey={todayKey} undoWindowMs={UNDO_WINDOW_MS} />
}
