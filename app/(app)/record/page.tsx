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
 * **The record.** §5's *My things*, on its own route since 5 September.
 *
 * ⚠⚠ **THIS WAS `/` UNTIL 5 SEPTEMBER AND THE MOVE IS THE WHOLE CHANGE.**
 * **Amendment 5**: the front page becomes the corpus above a composer, and the
 * record moves here behind a glyph in the foot. ⚠ **Nothing about the record
 * itself changed** — same read, same seed, same fifty-plus-one, same stamps,
 * same portal bit. See `docs/re-direction/the-front-page.md`.
 *
 * ⚠ **§5 has always specified *Home / Capture* and *My things* as two
 * surfaces.** Phase 1 collapsed them because the record was the only screen
 * there was; this un-collapses them, and lands on the specification rather than
 * departing from it.
 *
 * ⚠⚠ **THE APP IS STILL RECORD-FIRST, SO THIS IS ONE TAP AND NEVER MORE.**
 * The glyph in the foot is the whole of what pays for the move. If it is ever
 * two taps from anywhere, the move was a mistake.
 *
 * `/` was the capture box alone for about an hour on 9 August, then the poster
 * wall for a fortnight, then the record itself from 23 August to 5 September —
 * a blank page, one line per capture, the caret under the bar and the record
 * newest-first beneath it. See `docs/re-direction/phase-1-capture.md` and
 * `components/page-screen.tsx`.
 *
 * **Four routes went away when the record took `/`** — `/wants`,
 * `/go-back-tos`, `/fixtures` and `/archive`. Everything active is here;
 * everything settled is behind the tray.
 *
 * This component does three things and stops: the read, the stamps, and the
 * seed. The page owns its list from the first paint on, because Return has to
 * land in under a frame rather than after a round trip.
 */
export default async function RecordPage({
  searchParams,
}: {
  /*
    ⚠ **`?portal=1` is the composer's door arriving here — 5 September.** The
    front page carries the same lit door, and the portal's rows open consoles
    which only exist on this screen, so it navigates rather than opening a box
    it cannot fill. See `portalOpen` in `components/page-screen.tsx`.
  */
  searchParams: Promise<{ portal?: string }>
}) {
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

  const { portal } = await searchParams

  return (
    <PageScreen
      portalOpen={portal === '1'}
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
