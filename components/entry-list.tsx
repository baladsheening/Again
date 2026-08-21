import type { OwnerView } from '@/lib/db'
import type { EntryCard } from '@/lib/domain'
import { COLLECTIONS } from '@/lib/vocabulary'
import { EntryRow } from './entry-row'

/**
 * A collection, rendered. Every signed-in page below the shell is this list —
 * Wants adds a capture box above it and nothing else differs.
 *
 * Empty states instruct rather than apologise (§10). They are the only writing
 * in the app that a new account is guaranteed to read, so each one names the
 * action that fills the collection rather than reporting that it is empty.
 */
/** §4's collection names, by the view that renders them. See the `<h1>` below. */
const HEADING: Record<OwnerView, string> = {
  live: COLLECTIONS.wants,
  go_back_tos: COLLECTIONS.goBackTos,
  fixtures: COLLECTIONS.fixtures,
  archive: COLLECTIONS.archive,
}

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
  return (
    <>
      {/*
        **The page's heading, and it is `sr-only` on purpose.**

        Nothing in the signed-in app had an `<h1>` at all until 15 August, which
        the accessibility contract in docs/spec-sheet.md asks for and nothing
        met. The four collections are the easy half: they are already named on
        screen, in the bar at the foot and in the rail, so a visible heading
        would name each one twice — the exact duplication the 9 August redesign
        took out when `/` and `/me` were two doors onto one list.

        It reads `COLLECTIONS` rather than spelling the four names again, so the
        heading and the navigation cannot disagree about what a collection is
        called. The keys differ from `OwnerView`'s — `live` is the Wants view,
        for the §5.2 reason that a go-back-to is still a want — which is why
        there is a map here and not an index.
      */}
      <h1 className="sr-only">{HEADING[view]}</h1>

      {entries.length === 0 ? (
        <p className="text-muted max-w-sm py-10 text-sm">{EMPTY[view]}</p>
      ) : (
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
      )}
    </>
  )
}
