import { redirect } from 'next/navigation'

import { ComposeScreen } from '@/components/compose-screen'
import { Rail } from '@/components/rail'
import {
  getMyProfile,
  portalWaiting,
  getSessionUser,
  listMyPage,
  listRail,
  UNDO_WINDOW_MS,
} from '@/lib/db'
import { imagesAvailable } from '@/lib/media'

/**
 * **The front page: the corpus above, a composer below.** Amendment 5, 5
 * September.
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
 * it. See `docs/re-direction/the-front-page.md`.
 *
 * ⚠ **The browse half is built as of 6 September** — `listRail` and
 * `components/rail.tsx`. The rail is **handed down as a node**, not
 * imported by `ComposeScreen`: that screen is `'use client'`
 * because the composer is, and the rail is pure server markup, so crossing the
 * boundary as a prop keeps it out of the client bundle entirely. **The portal
 * hands its console down the same way.**
 *
 * There is still no seed for the composer, because there is no list on that
 * half: what gets written goes to the record, and the confirmation is one line
 * in the box.
 */
export default async function ComposePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  /*
    ⚠ **One row, not a count.** The only question is *is there a record to
    search* — search dims on an empty one because the only answer it could give
    is *Nothing.* A `count(*)` would be a second definition of the same bit and
    a table scan to answer it.

    ⚠ **The portal's bit rides down with it and is a pair of `exists`**, never a
    count: §5 forbids the portal a number, and a counting function is one
    refactor from displaying one. The door has to be right on the first paint,
    which only the server can know.
  */
  const [firstRow, waiting, tiles] = await Promise.all([
    listMyPage(sessionUser, { limit: 1 }),
    portalWaiting(sessionUser),
    /*
      ⚠ **In parallel with the other two, so the composer never waits on the
      corpus.** §2's *remove friction before adding intelligence*: the primary
      product quality is the speed of capture, and a rail that is slow to read
      must not hold up the box somebody types in.
    */
    listRail(sessionUser),
  ])

  return (
    <ComposeScreen
      /*
        ⚠ **A NODE, not a list of rows.** The rail is a server component and
        `ComposeScreen` is a client one; handing the finished markup down
        keeps the corpus read, the image URLs and the markup itself off the
        client entirely. Passing `tiles` instead would pull all of it
        across the boundary to render the same thing.
      */
      rail={<Rail tiles={tiles} />}
      portalWaiting={waiting}
      searchable={firstRow.length > 0}
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
