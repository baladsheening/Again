import { redirect } from 'next/navigation'

import { ProfileIdentity, SignOut } from '@/components/profile-panel'
import { Screen } from '@/components/screen'
import { TrackedPeople } from '@/components/tracked-people'
import { getMyProfile, getSessionUser, listMyTracks } from '@/lib/db'

/**
 * You, your people, and the way out — **in that order, down the page.**
 *
 * Reachable from the profile icon in the bar. It works at every width, because a
 * URL that only resolves on some screens is a trap.
 *
 * The people list landed here in Phase 2 because `/u/[handle]` had no way in:
 * §2 rules out discovery, so without this the only route to somebody's page is
 * retyping their handle.
 *
 * ⚠⚠ **THE COMPOSITION IS THE REDESIGN — 2 September.** This page used to be a
 * People card floating in an empty column with a fixed bar pinned across the
 * bottom holding the identity and the way out. **Both of those were positions
 * rather than structure.** Now the document is simply the three things this
 * screen is, in the order a person meets them: who you are, who you keep, the
 * way out. See `components/profile-panel.tsx` for why the bar failed §2 of the
 * brief and why nothing replaced it.
 *
 * ⚠ **The `sr-only` `<h1>` is DELETED and that is the point rather than a side
 * effect.** It existed because `ProfilePanel` was pinned to the foot and
 * `TrackedPeople` carries an `<h2>`, so neither could hold the page's heading
 * without the outline reading *h2 before h1* — a hidden heading was the cheapest
 * way to fix an order that the *layout* had broken. The identity comes first in
 * the document now, so it holds the `<h1>` itself and there is nothing to
 * correct. **Do not put a hidden heading back**: if one is ever needed again, it
 * means something has been pinned out of document order, and that is the thing
 * to look at.
 *
 * The note that used to sit here said a visible *Profile* would be a third label
 * saying what the tapped icon already said. **That argument still holds and is
 * why the handle is the heading rather than a heading above the handle.**
 */
export default async function ProfilePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  const people = await listMyTracks(sessionUser)

  return (
    <Screen>
      <ProfileIdentity handle={profile.handle} />
      <TrackedPeople people={people} />
      <SignOut />
    </Screen>
  )
}
