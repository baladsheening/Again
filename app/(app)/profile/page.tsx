import { redirect } from 'next/navigation'

import { ProfilePanel } from '@/components/profile-panel'
import { TrackedPeople } from '@/components/tracked-people'
import { getMyProfile, getSessionUser, listMyTracks } from '@/lib/db'

/**
 * You, your people, and the way out.
 *
 * Reachable from the profile icon in the phone header. The rail carries the
 * same two things in its own bottom-left corner at wider widths, so this page
 * is not the only route to them — but it works at every width, because a URL
 * that only resolves on some screens is a trap.
 *
 * The people list landed here in Phase 2 because `/u/[handle]` had no way in:
 * §2 rules out discovery, so without this the only route to somebody's page is
 * retyping their handle. It sits **above** the identity block rather than below
 * it, because that block is anchored to the bottom-left corner at every width on
 * purpose (see `ProfilePanel`) and this must not push it off that corner.
 */
export default async function ProfilePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  const people = await listMyTracks(sessionUser)

  return (
    <>
      <TrackedPeople people={people} />
      <ProfilePanel handle={profile.handle} displayName={profile.displayName} />
    </>
  )
}
