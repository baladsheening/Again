import { notFound, redirect } from 'next/navigation'

import { PersonList } from '@/components/person-list'
import { Screen } from '@/components/screen'
import { TrackButton } from '@/components/track-button'
import {
  getProfileByHandle,
  getSessionUser,
  getTrackState,
  listCapturesForOtherUser,
  toLegacyEntryCards,
} from '@/lib/db'
import { nameFor } from '@/lib/domain'
import { COLLECTIONS } from '@/lib/vocabulary'

/**
 * Somebody else's page (§5). The other half of the product — everything the app
 * lacked before this route existed is downstream of it.
 *
 * **Reached by handle, and only by handle.** There is no discovery, no search for
 * strangers and no directory (§2): you are here because someone gave you their
 * handle. That is why the route is `/u/[handle]` and not `/u/[id]`, and why
 * `getProfileByHandle` is the only way in.
 *
 * ⚠ **No longer visible without a mutual track.** This page used to show a
 * stranger who knew the handle the same two lists a mutual saw, and the
 * argument for it was that §6's suppression rule needs browsing to exist in
 * order to have something to suppress. That argument is retired; the rule is
 * not. Captures are private by default and reach a mutual only when their
 * owner shares them, so what a track changes now is access as well as naming.
 *
 * ⚠ **This page filters for none of that.** `listCapturesForOtherUser` applies
 * all four terms unconditionally — shared scope, mutual track both ways,
 * published state, and a reader who is not the owner — and `SharedView` cannot
 * even express the archive. If any of it regresses it will not be visible from
 * here, which is why the guarantee lives in the data layer (§13).
 *
 * ⚠ **The empty copy is conditional on the track and nothing else.** A
 * non-mutual gets the same sentence whether the owner holds a thousand
 * captures or none, because *this person has nothing* and *this person has
 * nothing for you* are different claims and the first is not the app's to
 * make.
 *
 * The private note, when it exists, must not reach this route either — see the
 * carry-forward register in `docs/plan.md`. It stays out of the projection rather
 * than out of the JSX.
 */
export default async function PersonPage({ params }: PageProps<'/u/[handle]'>) {
  const { handle } = await params

  const viewer = await getSessionUser()
  if (!viewer) redirect('/sign-in')

  const person = await getProfileByHandle(viewer, handle)
  if (!person) notFound()

  // Your own handle is your own page. A second view of yourself would differ
  // from it only by being worse.
  if (person.id === viewer.id) redirect('/')

  const track = await getTrackState(viewer, person.id)

  const [live, fixtures] = await Promise.all([
    listCapturesForOtherUser(viewer, person.id, 'live'),
    listCapturesForOtherUser(viewer, person.id, 'fixtures'),
  ])

  /*
    §5's identity rule, and the only place on this page that decides what to call
    anyone. `nameFor` returns the handle with its `@` when there is no name to
    show, so the heading is never empty and never has to be conditional.
  */
  const name = nameFor({ ...person, mutual: track.mutual })
  const nameIsHandle = name === `@${person.handle}`

  return (
    <Screen>
      <div className="flex flex-col gap-10">
      <header className="flex flex-col items-start gap-4">
        <h1 className="title">{name}</h1>

        {/*
          The handle repeats under the name only when the name is not already it.
          Same shape as `/profile`, which sets your own name over your own handle
          — and sans rather than mono, because a displayed handle is a name
          rather than data (§11).
        */}
        {!nameIsHandle && <span className="text-muted text-sm">@{person.handle}</span>}

        <TrackButton handle={person.handle} initial={track} />
      </header>

      {/*
        Their wants, then what they own. Two of the three public views, and the
        pair is not arbitrary: the live list is what a `convergence` or a `guide`
        would be about, and the fixtures are what a `lend` would be about (§6).
        Go-back-tos are inside the live list already, because a go-back-to is
        still a want (§5.2).

        Fixtures render only when there are some — most pages will have none, and
        an empty *Fixtures* heading on every page would be furniture.
      */}
      <PersonList
        heading={COLLECTIONS.wants}
        entries={toLegacyEntryCards(live)}
        empty={track.mutual ? 'Nothing here yet.' : 'This list is not shared with you.'}
      />

        <PersonList heading={COLLECTIONS.fixtures} entries={toLegacyEntryCards(fixtures)} />
      </div>
    </Screen>
  )
}
