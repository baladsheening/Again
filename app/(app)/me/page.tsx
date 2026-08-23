import { permanentRedirect } from 'next/navigation'

/**
 * `/me` was the four collections behind a `?view=` parameter. They became routes
 * on 9 August, and the routes went with the poster wall when the capture page
 * landed: everything live is on `/`, everything settled is behind `/settled`.
 *
 * This survives only to keep links that were already handed out working, and it
 * still translates the old parameter rather than dropping everyone on the page —
 * a bookmarked `?view=archive` was a bookmark of settled things, not of the app.
 *
 * ⚠ **`live` lands on the page and the other three land on the tray**, which is
 * the same two-way split `WHERE_IT_IS` makes. It is not read from there: this
 * maps a *query parameter that no longer exists* to a route, and that table maps
 * a state to one. Sharing them would tie a redirect for old bookmarks to the
 * shape of the product.
 */
const MOVED: Record<string, '/' | '/settled'> = {
  live: '/',
  go_back_tos: '/settled',
  fixtures: '/settled',
  archive: '/settled',
}

export default async function MePage({ searchParams }: PageProps<'/me'>) {
  const params = await searchParams
  const requested = Array.isArray(params.view) ? params.view[0] : params.view

  permanentRedirect(MOVED[requested ?? 'live'] ?? '/')
}
