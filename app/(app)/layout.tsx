import { redirect } from 'next/navigation'

import { Nav } from '@/components/nav'
import { getMyProfile, getSessionUser } from '@/lib/db'

/**
 * The signed-in shell.
 *
 * This redirect is for the person, not for security: layouts do not re-run on
 * every navigation and cannot cover Server Actions. The actual boundary is
 * `lib/db/`, where every function requires a `SessionUser` that only a real
 * session can produce (§3).
 */
export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  return (
    <>
      <Nav handle={profile.handle} />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-6">{children}</main>
    </>
  )
}
