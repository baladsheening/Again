import { redirect } from 'next/navigation'
import Link from 'next/link'

import { EntryRow } from '@/components/entry-row'
import { getSessionUser, listMyEntries, toEntryCard, type OwnerView } from '@/lib/db'
import { COLLECTIONS } from '@/lib/vocabulary'

/**
 * §8: Wants / Go-back-tos / Fixtures / Archive.
 *
 * Verbs vary, collections don't (§4) — everyone has the same four whatever they
 * contain. Archive is `state = 'done'` and is owner-only (§5.3); it is reachable
 * here and from nowhere else in the product.
 */

const TABS = [
  { view: 'live', label: COLLECTIONS.wants },
  { view: 'go_back_tos', label: COLLECTIONS.goBackTos },
  { view: 'fixtures', label: COLLECTIONS.fixtures },
  { view: 'archive', label: COLLECTIONS.archive },
] as const satisfies ReadonlyArray<{ view: OwnerView; label: string }>

const EMPTY: Record<OwnerView, string> = {
  live: 'Nothing yet. The input box on Add is where this starts.',
  go_back_tos: 'Nothing here until you resolve something and say you would go back.',
  fixtures: 'Things you own and would keep will collect here.',
  archive: 'Things you tried and would not return to. Only you can see this.',
}

export default async function MePage({ searchParams }: PageProps<'/me'>) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const params = await searchParams
  const requested = Array.isArray(params.view) ? params.view[0] : params.view
  const view: OwnerView =
    TABS.find((t) => t.view === requested)?.view ?? 'live'

  const entries = await listMyEntries(sessionUser, view)

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Collections" className="border-rule flex gap-5 border-b pb-3">
        {TABS.map((tab) => (
          <Link
            key={tab.view}
            href={tab.view === 'live' ? '/me' : `/me?view=${tab.view}`}
            aria-current={view === tab.view ? 'page' : undefined}
            className={`text-sm transition-colors ${
              view === tab.view ? 'text-text' : 'text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {entries.length > 0 ? (
        <ul className="flex flex-col">
          {entries.map((row) => (
            <EntryRow key={row.entry.id} card={toEntryCard(row)} />
          ))}
        </ul>
      ) : (
        <p className="text-muted py-8 text-sm">{EMPTY[view]}</p>
      )}
    </div>
  )
}
