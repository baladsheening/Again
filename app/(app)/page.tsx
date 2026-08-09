import { redirect } from 'next/navigation'

import { Capture } from '@/components/capture'
import { getMyProfile, getSessionUser } from '@/lib/db'

/**
 * Home: the capture box, and nothing else.
 *
 * `/` used to be Wants — the input with the live list under it, which is how §8
 * describes the home screen. Splitting them on 9 August makes capture a place
 * rather than the top of a list, and it is what makes the house glyph in the
 * phone bar point somewhere of its own instead of at the collection beside it.
 *
 * **It takes no data.** The list moved to `/wants`, so this route has nothing to
 * read — the session and profile checks below are the only server work, and they
 * are for the person rather than for security (the boundary is `lib/db/`, §3).
 */
export default async function HomePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  return <Capture />
}
