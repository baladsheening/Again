import { redirect } from 'next/navigation'

import { EntryList } from '@/components/entry-list'
import { getSessionUser, listMyCaptures, toLegacyEntryCards } from '@/lib/db'

/**
 * §5.2. The live pool: `state in ('want','go_back_to')` — a go-back-to is still
 * a want, because it is repeatable. Fixtures are deliberately not here; already
 * possessed means there is nothing left to want.
 *
 * Satisfied wants sink below everything still unwatched (`orderFor` in
 * `lib/db/captures.ts`), so the top of the list is what you have not seen yet,
 * which is what the list is for.
 *
 * This was `/` until 9 August, sharing the route with the capture box. The
 * capture box kept `/` and the list moved here.
 */
export default async function WantsPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const entries = await listMyCaptures(sessionUser, 'live')

  return <EntryList entries={toLegacyEntryCards(entries)} view="live" />
}
