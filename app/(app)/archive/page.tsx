import { redirect } from 'next/navigation'

import { EntryList } from '@/components/entry-list'
import { getSessionUser, listMyCaptures, toLegacyEntryCards } from '@/lib/db'

/**
 * §5.3. `state = 'done'` — tried, and not pushed to go-back-tos.
 *
 * **Owner only.** This is the one collection that never appears on anyone
 * else's page, in any aggregate, or in overlap. `listEntriesForOtherUser`
 * cannot return these rows at all, and `PublicView` cannot express this view;
 * the guarantee lives in `lib/db/` rather than in this route (§3).
 */
export default async function ArchivePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const entries = await listMyCaptures(sessionUser, 'archive')

  return <EntryList entries={toLegacyEntryCards(entries)} view="archive" />
}
