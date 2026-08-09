import { redirect } from 'next/navigation'

import { Capture } from '@/components/capture'
import { getMyProfile, getSessionUser, listMyEntries, toEntryCard } from '@/lib/db'

/**
 * Wants, and the capture box (§8): input at the top, the live list beneath.
 *
 * This is `/` because capture is the fastest thing in the product and the
 * fastest thing should be at the shortest address. It used to share its content
 * with `/me`, which defaulted to the same `live` view — two top-level
 * destinations onto one list. `/me` now redirects here.
 *
 * Live is `state in ('want','go_back_to')` (§5.2) — a go-back-to is still a
 * want, because it is repeatable. Fixtures are deliberately not here: already
 * possessed means there is nothing left to want.
 */
export default async function WantsPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  const entries = await listMyEntries(sessionUser, 'live')

  return <Capture entries={entries.map(toEntryCard)} />
}
