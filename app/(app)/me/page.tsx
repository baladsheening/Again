import type { Route } from 'next'
import { permanentRedirect } from 'next/navigation'

/**
 * `/me` was the four collections behind a `?view=` parameter, under a header
 * that also offered `/`. Its default view and `/` listed the same rows, so half
 * the top-level navigation was a duplicate — see `components/shell.tsx` for the
 * whole of that reasoning.
 *
 * The collections are routes now. This survives only to keep links that were
 * already handed out working, and translates the old parameter rather than
 * dropping everyone on Wants: a bookmarked `?view=archive` was a bookmark of
 * the archive, not of the app.
 */
const MOVED: Record<string, Route> = {
  live: '/',
  go_back_tos: '/go-back-tos',
  fixtures: '/fixtures',
  archive: '/archive',
}

export default async function MePage({ searchParams }: PageProps<'/me'>) {
  const params = await searchParams
  const requested = Array.isArray(params.view) ? params.view[0] : params.view

  permanentRedirect(MOVED[requested ?? 'live'] ?? '/')
}
