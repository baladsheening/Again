import { redirect } from 'next/navigation'

import { getMyProfile, getSessionUser } from '@/lib/db'

/**
 * The signed-in group, and it is a gate rather than a frame now.
 *
 * This redirect is for the person, not for security: layouts do not re-run on
 * every navigation and cannot cover Server Actions. The actual boundary is
 * `lib/db/`, where every function requires a `SessionUser` that only a real
 * session can produce (§3).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What left this file when the page landed
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **`Shell`, `CaptureProvider` and `SearchProvider`.** The shell was one
 * navigation for four collection routes that no longer exist; the two providers
 * existed so that the poster wall and the search field could both end in the
 * same film flow, and neither surface is on the capture page.
 *
 * ⚠ **The bar is rendered by each route rather than by this layout**, and that
 * is deliberate rather than a shortcut. The bar's undo acts on the page's own
 * last capture, and the foot's controls act on the line the page has picked —
 * so furniture in a layout would have to reach *up* for state a child owns,
 * through a context whose only subscriber is the thing that publishes to it.
 * Four routes rendering `<Bar />` is one component used four times; a provider
 * around them would be an indirection with nothing on the other end.
 *
 * ⚠ **Nothing is fetched here any more.** The collection counts were chrome for
 * a navigation that has gone, and fetching them for every route would be a query
 * on the critical path of a screen whose whole promise is that it opens.
 */
export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const profile = await getMyProfile(sessionUser)
  if (!profile) redirect('/onboarding')

  return children
}
