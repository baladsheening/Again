import { redirect } from 'next/navigation'

import { PageScreen } from '@/components/page-screen'
import {
  getMyProfile,
  portalWaiting,
  getSessionUser,
  listMyPage,
  pageCursor,
  PAGE_SIZE,
  UNDO_WINDOW_MS,
} from '@/lib/db'
import { dayStamper } from '@/lib/day'
import { imagesAvailable } from '@/lib/media'
import { toPageLines } from '@/lib/page-line'
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

    ⚠ **One row past the slice, which is how the page knows there is more.** No
    count and no second query: if fifty-one came back there is a fifty-first, the
    extra is dropped, and the fiftieth becomes the cursor *Earlier* reads from.
    See `pageCursor` for why it is a cursor and not an offset.
  */
  /*
    ⚠ **One bit, and it rides with the record's own read.** The portal's glyph
    has to be right on the first paint, which only the server can know — so the
    door's state comes down with the document while its *rows* do not. See
    `portalWaiting`, which is a pair of `exists` rather than counts because §5
    forbids the portal a number and a counting function is one refactor from
    displaying one. ⚠ **Two bits since 4 September** — the door says C, R or
    C/R, because a request needs answering and a convergence does not.
  */
  const [rows, waiting] = await Promise.all([
    listMyPage(sessionUser, { limit: PAGE_SIZE + 1 }),
    portalWaiting(sessionUser),
  ])
  const more = rows.length > PAGE_SIZE
  const shown = more ? rows.slice(0, PAGE_SIZE) : rows

  /*
    The stamps are computed here and only here. Grouping by day depends on a
    timezone, and the server's and the browser's are not the same — a page that
    formatted on both sides would disagree about how many groups there are for
    anything written after 23:00 local, which is a structural hydration mismatch
    in a list. See `lib/day.ts`.
  */
  const { todayKey, stamp } = dayStamper(new Date(), (await viewerTimeZone()) ?? undefined)

  return (
    <PageScreen
      lines={toPageLines(shown, stamp)}
      todayKey={todayKey}
      undoWindowMs={UNDO_WINDOW_MS}
      /* Phase 2 step 3: is there anything to say. One bit — never a count. */
      portalWaiting={waiting}
      /*
        ⚠ **`null` is the record ending, and it is the only thing that says so.**
        The tail control exists exactly while this is a string, so a record of
        fewer than fifty lines never grows one.
      */
      earlier={more ? pageCursor(shown[shown.length - 1]) : null}
      /*
        ⚠ **A server fact, because the token is one.** The camera is dark when
        there is nowhere to put a photograph — a control that cannot act goes
        off — which also means deploying with no Blob store is safe rather than
        broken. See `imagesAvailable`.
      */
      imagesOn={imagesAvailable()}
    />
  )
}
