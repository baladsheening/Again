import type { OwnerView } from '@/lib/db'
import type { EntryCard } from '@/lib/domain'
import { EntryRow } from './entry-row'

/**
 * A collection, rendered. Every signed-in page below the shell is this list —
 * Wants adds a capture box above it and nothing else differs.
 *
 * Empty states instruct rather than apologise (§10). They are the only writing
 * in the app that a new account is guaranteed to read, so each one names the
 * action that fills the collection rather than reporting that it is empty.
 */
const EMPTY: Record<OwnerView, string> = {
  live: 'Nothing yet. Home is where this starts — one film, anything you have been meaning to watch.',
  go_back_tos: 'Resolve something and say you would go back, and it collects here.',
  fixtures: 'Things you own and would keep will collect here.',
  archive: 'Things you tried and would not return to. Only you can see this.',
}

export function EntryList({
  entries,
  view,
  isPending,
}: {
  entries: EntryCard[]
  view: OwnerView
  /**
   * Which rows are mid-flight. Only Wants passes this — it is the one list
   * rendered optimistically, and the predicate lives with the caller because
   * only the caller knows which of its rows it invented.
   */
  isPending?: (card: EntryCard) => boolean
}) {
  if (entries.length === 0) {
    return <p className="text-muted max-w-sm py-10 text-sm">{EMPTY[view]}</p>
  }

  return (
    <ul className="flex flex-col">
      {entries.map((card) => (
        <EntryRow
          key={card.id}
          card={card}
          view={view}
          pending={isPending?.(card) ?? false}
        />
      ))}
    </ul>
  )
}
