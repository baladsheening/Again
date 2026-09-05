import { redirect } from 'next/navigation'

import { ComposeScreen } from '@/components/compose-screen'
import { getMyProfile, portalWaiting, getSessionUser, listMyPage } from '@/lib/db'

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
 * ⚠ **The browse half is not built.** Step 3 of the brief's sequence fills it
 * from the corpus, and until then its space is deliberately empty rather than
 * occupied by a placeholder that would have to be deleted.
 *
 * This component does two reads and stops. There is no seed, because there is
 * no list on this screen: what gets written goes to the record, and the
 * confirmation is one line in the composer.
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
  const [firstRow, waiting] = await Promise.all([
    listMyPage(sessionUser, { limit: 1 }),
    portalWaiting(sessionUser),
  ])

  return <ComposeScreen portalWaiting={waiting} searchable={firstRow.length > 0} />
}
