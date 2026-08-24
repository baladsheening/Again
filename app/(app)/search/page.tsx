import { redirect } from 'next/navigation'

import { Screen } from '@/components/screen'
import { SearchScreen } from '@/components/search-screen'
import { getMyProfile, getSessionUser } from '@/lib/db'

/**
 * Search: **where is that thing I wrote in June.**
 *
 * The route is a shell: auth, and the frame. Everything else is typed.
 *
 * ⚠ **It reads across live, crossed-off and settled captures**, which is why it
 * is a surface rather than a filter over the page's list. `searchMyCaptures`
 * says why that is safe with `done` in it (§5.3): it filters on the owner, and
 * nothing derived from it is ever handed to anybody else.
 *
 * ⚠ **No foot.** Like the tray, this is a destination and not a screen with
 * tools — the foot's controls act on the line the caret is on and nothing here
 * is live. See `Screen`.
 */
export default async function SearchPage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  /*
    ⚠ **No read at all, which is the whole of what this route does.** It asked
    for a count first, to decide whether to say *nothing captured yet* before
    anybody typed — and that is a state the surface does not need: a person with
    an empty record types and gets *Nothing.*, by the same path as every other
    answer. A query whose only job is to pre-empt an answer the page already
    gives is a second opinion about the same fact.
  */
  return (
    <Screen>
      <SearchScreen />
    </Screen>
  )
}
