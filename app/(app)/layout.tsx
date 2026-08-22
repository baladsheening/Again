import { redirect } from 'next/navigation'

import { CaptureProvider } from '@/components/capture-provider'
import { SearchProvider } from '@/components/search-provider'
import { Shell } from '@/components/shell'
import { countMyCaptures, getMyProfile, getSessionUser } from '@/lib/db'

/**
 * The signed-in shell.
 *
 * This redirect is for the person, not for security: layouts do not re-run on
 * every navigation and cannot cover Server Actions. The actual boundary is
 * `lib/db/`, where every function requires a `SessionUser` that only a real
 * session can produce (§3).
 *
 * The counts are fetched here rather than in each page for the same reason the
 * navigation lives here: they are chrome, and chrome that four pages each had
 * to remember to fetch would be wrong on the first page that forgot.
 */
export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  const counts = await countMyCaptures(sessionUser)

  /*
    `CaptureProvider` wraps the shell rather than sitting inside it, because the
    search field lives *in* the shell's bottom bar on a phone and the poster wall
    lives in `children`. Both start the same add, so the flow has to be above
    both of them.
  */
  /*
    `SearchProvider` sits inside `CaptureProvider` and outside `Shell`, because
    the query is read in two places the shell straddles: the field in its
    furniture, and the wall it renders in place of `children` while a search is
    live. Picking a result still ends in the capture flow above it.
  */
  return (
    <CaptureProvider>
      <SearchProvider>
        <Shell handle={profile.handle} counts={counts}>
          {children}
        </Shell>
      </SearchProvider>
    </CaptureProvider>
  )
}
