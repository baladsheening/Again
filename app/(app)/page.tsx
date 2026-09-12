import { redirect } from 'next/navigation'

import { ComposeScreen } from '@/components/compose-screen'
import { Opportunity } from '@/components/opportunity'
import { PageLines } from '@/components/page-lines'
import { portalAction } from '@/app/actions/portal'
import {
  getMyProfile,
  portalWaiting,
  getSessionUser,
  listMyPage,
  PAGE_SIZE,
  UNDO_WINDOW_MS,
} from '@/lib/db'
import { dayStamper } from '@/lib/day'
import { imagesAvailable } from '@/lib/media'
import { toPageLines } from '@/lib/page-line'
import { viewerTimeZone } from '@/lib/region'

/**
 * **The front page: what you can act on, your record, and a composer.**
 *
 * ⚠⚠ **THIS WAS THE RECORD UNTIL 5 SEPTEMBER AND THE RECORD IS AT `/record`.**
 * Directed: *the front page is a place where people can both lodge a thought as
 * quickly as possible and browse by swiping images of experiences and
 * productions — the top half a YouTube/Netflix visual mode, the bottom half a
 * Claude/ChatGPT mode with a box to type and attach things before submitting.*
 *
 * ⚠ **§5 has always specified *Home / Capture* and *My things* as two
 * surfaces.** Phase 1 collapsed them because the record was the only screen
 * there was. This is not a departure from the specification; it is arriving at
 * it. See `docs/re-direction/inactive/the-front-page.md`.
 *
 * ⚠⚠ **THE BROWSE HALF IS NOT COMING BACK AND ITS HOLE IS FILLED — 12
 * September, directed.** It was pulled on 7 September so the keyboard could be
 * judged with one variable on screen, and Amendment 10 then put *a global or
 * random browse rail, image-only tiles, and the opening count* in the Release 1
 * exclusions. **Measured before this change, at 390×844: header 0–48, nothing
 * until 620, composer and foot below it — 572px, 68% of the handset, held
 * against a feature the product had banned.** That is the bottom-third floor's
 * fault exactly, deleted the same week on the same grounds.
 *
 * ⚠ **What fills it is what already existed**, in the order `product-truth.md`
 * puts it: the convergences you can act on, then your own record, then the
 * composer in the thumb. **No new query, no new feature, no discovery.**
 */
export default async function ComposePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  /*
    ⚠ **One bit for search, and it is now free.** The only question is *is there
    a record to search* — search dims on an empty one because the only answer it
    could give is *Nothing.* A `count(*)` would be a second definition of the
    same bit and a table scan to answer it; it used to read one row to derive it
    and now derives it from the rows the page draws anyway.

    ⚠ **The portal's bit rides down with it and is a pair of `exists`**, never a
    count: §5 forbids the portal a number, and a counting function is one
    refactor from displaying one. The door has to be right on the first paint,
    which only the server can know.

    ⚠ **`PAGE_SIZE`, never a home-sized number.** This is the first page of the
    record, which is a thing that already exists; a budget chosen for a handset
    would be a fourth breakpoint wearing a list's clothes. ⚠ **And no `earlier`
    cursor** — there is no tail control on this screen, because the record has a
    screen of its own and the foot is one tap from it. **Home is a window on the
    record, not a second copy of it.**
  */
  const [rows, waiting] = await Promise.all([
    listMyPage(sessionUser, { limit: PAGE_SIZE }),
    portalWaiting(sessionUser),
  ])

  /*
    The stamps are computed here and only here. Grouping by day depends on a
    timezone, and the server's and the browser's are not the same — a page that
    formatted on both sides would disagree about how many groups there are for
    anything written after 23:00 local, which is a structural hydration mismatch
    in a list. See `lib/day.ts`, and the record's page over the same call.
  */
  const { stamp } = dayStamper(new Date(), (await viewerTimeZone()) ?? undefined)

  /*
    ⚠⚠ **THE PORTAL'S ROWS ARE READ ONLY WHEN THE CHEAP BIT SAYS THERE ARE
    ANY.** `listMyPortal` is a join to `notifications`, and the record's page
    refuses in writing to put one in front of every capture — the same promise
    holds here, because this is the screen where Return has to land in under a
    frame. **The stated cost: whoever HAS a convergence pays a second, serial
    round trip before first paint.** It cannot join the `Promise.all` above,
    because it is conditional on that call's answer. ⚠ **If that latency ever
    shows, the lever is one `Promise.all` and everybody pays the join** — not a
    cache, and not a client fetch after paint, which would make the band arrive
    late on the one screen whose content must not move.

    ⚠ **A failure draws nothing, and that is not an error here.** §6: the band
    is silent when there is nothing to say and silent when the read did not
    answer. The door in the foot is lit either way, off the bit that did.
  */
  const seeded = waiting.lines ? await portalAction() : null
  const opportunities = seeded?.ok ? seeded.value.lines : []

  return (
    <ComposeScreen
      portalWaiting={waiting}
      searchable={rows.length > 0}
      /*
        ⚠⚠ **NODES, NOT ROWS — the arrangement the rail was going to use, and it
        is finally carrying something.** `ComposeScreen` is `'use client'`
        because the composer is; both of these are pure server markup, so
        crossing the boundary as props keeps the reads, the sentences and the
        markup itself out of the client bundle entirely. Passing rows instead
        would pull all of it across to render the same thing. **The portal hands
        its console down the same way.**
      */
      opportunity={<Opportunity lines={opportunities} />}
      record={<PageLines lines={toPageLines(rows, stamp)} />}
      /*
        ⚠ **Handed down, because the number belongs to the delete.**
        `undoCapture` bounds itself in SQL against `created_at`, and a second
        `10_000` written in a client component is a clock that can disagree with
        the one that actually decides. The record's page does the same.
      */
      undoWindowMs={UNDO_WINDOW_MS}
      /*
        ⚠ **A server fact, because the token is one.** Attach is dark when there
        is nowhere to put a photograph — a control that cannot act goes off —
        which also means deploying with no Blob store is safe rather than broken.
      */
      imagesOn={imagesAvailable()}
    />
  )
}
