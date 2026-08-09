import { redirect } from 'next/navigation'

import { ProfilePanel } from '@/components/profile-panel'
import { getMyProfile, getSessionUser } from '@/lib/db'

/**
 * You, and the way out.
 *
 * Reachable from the profile icon in the phone header. The rail carries the
 * same two things in its own bottom-left corner at wider widths, so this page
 * is not the only route to them — but it works at every width, because a URL
 * that only resolves on some screens is a trap.
 */
export default async function ProfilePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  return <ProfilePanel handle={profile.handle} displayName={profile.displayName} />
}
