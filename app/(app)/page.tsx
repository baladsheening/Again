import { redirect } from 'next/navigation'

import { Capture } from '@/components/capture'
import { getMyProfile, getSessionUser, listMyEntries, toEntryCard } from '@/lib/db'

/**
 * The whole home screen (§8): input box at top, live list beneath.
 *
 * Live is `state in ('want','go_back_to')` (§5.2) — a go-back-to is still a
 * want, because it is repeatable. Fixtures are deliberately not here: already
 * possessed means there is nothing left to want.
 */
export default async function Home() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  const entries = await listMyEntries(sessionUser, 'live')

  return <Capture entries={entries.map(toEntryCard)} />
}
