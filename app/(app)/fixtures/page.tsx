import { redirect } from 'next/navigation'

import { EntryList } from '@/components/entry-list'
import { getSessionUser, listMyCaptures, toLegacyEntryCards } from '@/lib/db'

/**
 * §5. Things you own and would keep. Deliberately *not* in the live pool —
 * already possessed means there is nothing left to want — but they still
 * participate in overlap, which is the `lend` match (§6).
 */
export default async function FixturesPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const entries = await listMyCaptures(sessionUser, 'fixtures')

  return <EntryList entries={toLegacyEntryCards(entries)} view="fixtures" />
}
