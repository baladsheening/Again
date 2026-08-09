import { redirect } from 'next/navigation'

import { EntryList } from '@/components/entry-list'
import { getSessionUser, listMyEntries, toEntryCard } from '@/lib/db'

/**
 * §5.2. Things you would return to. Ordered most recently resolved first —
 * these used to rank by how many times you had been back, and that count was
 * removed on 8 August (docs/decisions.md).
 */
export default async function GoBackTosPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const entries = await listMyEntries(sessionUser, 'go_back_tos')

  return <EntryList entries={entries.map(toEntryCard)} view="go_back_tos" />
}
