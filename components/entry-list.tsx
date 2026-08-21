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
  /*
    Not a collection of its own — a band inside the archive, and the archive is
    the page it is on. It never actually renders: `dropped` is only ever asked
    for as a band, and a band is named by its `band` label rather than from here.
    The key exists because the map is total, and naming the page it belongs to is
    the only answer that would not be a lie if something ever did read it.
  */
  dropped: COLLECTIONS.archive,
}

const EMPTY: Record<OwnerView, string> = {
  live: 'Nothing yet. Home is where this starts — one film, anything you have been meaning to watch.',
  go_back_tos: 'Resolve something and say you would go back, and it collects here.',
  fixtures: 'Things you own and would keep will collect here.',
  archive: 'Things you tried and would not return to. Only you can see this.',
  /*
    Never rendered as written: the archive only draws this band when it has rows
    in it, so an account that has never let anything go sees the page exactly as
    it was before this existed. It is here because the map is total, and a total
    map is what makes a missing case a build failure rather than a blank.
  */
  dropped: 'Wants you let go of collect here. Only you can see this.',
}

export function EntryList({
  entries,
  view,
  isPending,
  band,
}: {
  entries: EntryCard[]
  view: OwnerView
  /**
   * Which rows are mid-flight. Only Wants passes this — it is the one list
   * rendered optimistically, and the predicate lives with the caller because
   * only the caller knows which of its rows it invented.
   */
  isPending?: (card: EntryCard) => boolean
  /**
   * This list's own name, when it is one of several on a page — 21 August.
   *
   * Only the archive passes it, and only because it holds two. A band names
   * itself visibly and at `h2`, because the argument for the `sr-only` `h1`
   * below is that the collection is already named in the bar and in the rail;
   * that argument does not reach a second list on the same page, which nothing
   * else names at all. The page keeps the `h1` and owns it.
   *
   * ⚠ **The label is passed rather than read from `HEADING`, because a band is
   * not a collection.** The first draft used the map and the archive's first
   * band came out saying "Archive" — under a page called Archive, beside a rail
   * item called Archive. A band's name has to say which *part* of the page it
   * is, so only the page can supply it. See the archive route.
   */
  band?: string
}) {
  /*
    The rows, written once. The two returns below differ in what they put above
    this and in nothing else — a second copy of the empty state is how the two
    drift into disagreeing about what an empty collection says.
  */
  const rows =
    entries.length === 0 ? (
      <p className="text-muted max-w-sm py-10 text-sm">{EMPTY[view]}</p>
    ) : (
      <ul className="flex flex-col">
        {entries.map((card) => (
          <EntryRow key={card.id} card={card} view={view} pending={isPending?.(card) ?? false} />
        ))}
      </ul>
    )

  if (band !== undefined) {
    /*
      The separator belongs to the gap *between* bands, so it is drawn by the
      DOM position rather than by a prop numbering them — asking the caller which
      band this is would be asking it to know something the page already says.

      ⚠ **`first-of-type`, not `first`.** It was `first:` and the top rule drew
      anyway: the page's `sr-only` `<h1>` is the real first child, so no section
      was ever `:first-child`. `:first-of-type` counts only the sections, which
      is the thing actually being separated.
    */
    return (
      <section className="border-rule mt-12 border-t pt-8 first-of-type:mt-0 first-of-type:border-t-0 first-of-type:pt-0">
        <h2 className="micro text-muted mb-1">{band}</h2>
        {rows}
      </section>
    )
  }

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
      {rows}
    </>
  )
}
