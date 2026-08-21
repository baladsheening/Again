import { redirect } from 'next/navigation'

import { EntryList } from '@/components/entry-list'
import { getSessionUser, listMyEntries, toEntryCard } from '@/lib/db'
import { COLLECTIONS } from '@/lib/vocabulary'

/**
 * §5.3. The two private states, and the one page that holds them.
 *
 * **Owner only.** This is the one collection that never appears on anyone
 * else's page, in any aggregate, or in overlap. `listEntriesForOtherUser`
 * cannot return these rows at all, and `PublicView` cannot express either view;
 * the guarantee lives in `lib/db/` rather than in this route (§3).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two bands, and only when there are two — 21 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `done` is what you tried and would not go back to. `dropped` is what you never
 * tried and stopped meaning to. Both are private, both are at rest, and putting
 * them in one undifferentiated list is the thing that made `dropped` necessary
 * in the first place — the archive is only worth reading back while *done* means
 * done, and a bin of lapsed intentions mixed in is exactly what stops it meaning
 * that. Two bands on one page keeps the distinction without spending a fifth
 * slot in the collection bar on it.
 *
 * ⚠ **The second band draws only when it has rows**, which is also why the first
 * band's heading is conditional: an account that has never let anything go sees
 * this page exactly as it was before any of this was built. The feature is
 * invisible until it is used, and a heading over the only list on a page is the
 * duplication the `sr-only` `h1` in `EntryList` exists to avoid.
 */
export default async function ArchivePage() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  /*
    Two queries rather than one filtered in the component: each band paginates
    on its own, which is the difference between a page that stays correct at
    fifty rows and one that only looks correct at five. They are independent, so
    they go in parallel.
  */
  const [tried, letGo] = await Promise.all([
    listMyEntries(sessionUser, 'archive'),
    listMyEntries(sessionUser, 'dropped'),
  ])

  if (letGo.length === 0) {
    return <EntryList entries={tried.map(toEntryCard)} view="archive" />
  }

  return (
    <>
      {/* The page's own heading, for the reason `EntryList` states: with two
          lists under it, the `h1` belongs to the page and not to either one. */}
      <h1 className="sr-only">{COLLECTIONS.archive}</h1>
      {/*
        ⚠ **"Tried", not "Archive".** The band names the part rather than the
        page: the first draft read the label off `EntryList`'s heading map and
        came out with *Archive* sitting under a page called Archive, beside a
        rail item called Archive — the duplication that `sr-only` `h1` exists to
        prevent, reintroduced one level down. Each label states the criterion the
        rows in it meet, the way "go-back-to" does (§4).
      */}
      <EntryList entries={tried.map(toEntryCard)} view="archive" band="Tried" />
      <EntryList entries={letGo.map(toEntryCard)} view="dropped" band="Not any more" />
    </>
  )
}
