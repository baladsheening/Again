import type { Route } from 'next'
import Link from 'next/link'

import { AddPerson } from './add-person'
import type { TrackedPerson } from '@/lib/db'
import { nameFor } from '@/lib/domain'

/**
 * Who you track, on `/profile`.
 *
 * It exists because `/u/[handle]` is otherwise unreachable: §2 rules out
 * discovery and search for strangers, so the only way to a person's page is a
 * handle somebody gave you — and typing it once should not be the only way back.
 * This is a list of people you have already reached, not a directory.
 *
 * ⚠ **Whether a track is mutual is legible without being labelled.** `nameFor`
 * shows a name for a mutual and `@handle` for everyone else, so a row wearing a
 * handle is a track that has not been returned. That is the identity rule doing
 * the work rather than a badge repeating it — and it is the reason not to add a
 * *mutual* tag here, which would state the same fact twice and give the weaker
 * version its own visual weight.
 *
 * ⚠⚠ **AND THAT WAS TOO SUBTLE, REPORTED 4 SEPTEMBER: THE PENDING ROW SAYS
 * *REQUESTED* NOW.** The reasoning above holds for a *mutual* tag and does not
 * hold for its opposite. A handle rather than a name is legible only to somebody
 * who already knows the identity rule, and what it is being asked to carry is
 * not an aesthetic distinction — it is **whether the thing you just did has
 * happened yet**. Since 4 September the field above adds people, so this list is
 * where an add is confirmed, and *no confirmation* is precisely the failure the
 * handshake exists to remove.
 *
 * ⚠ **Still no tag on a mutual.** One state is labelled and the other is not,
 * deliberately: **the label marks what is unfinished.** A pair of tags would be
 * a status column, and being someone's mutual is the resting state of this list
 * rather than an achievement to mark.
 */
export function TrackedPeople({ people }: { people: TrackedPerson[] }) {
  return (
    <section className="flex flex-col">
      {/*
        ──────────────────────────────────────────────────────────────────────
         The pill (17 August)
        ──────────────────────────────────────────────────────────────────────

        The heading and its body sit on a filled ground with rounded corners and
        **no hairline**, which makes it the first surface in the app without one.
        Every other use of `--color-surface` — the toast, the intent sheet, the
        auth fields, the poster placeholder — pairs the fill with `border-rule
        border`. Here the fill alone does the containing, on the argument that
        already took the rule out from under the wordmark and off the top of the
        foot bar: a border drawn around a shape that is already a shape names a
        boundary the eye has got.

        **The spacing belongs to the pill now, not to its children.** The
        heading's `mt-5` and the paragraph's `pt-1 pb-6` are gone — the outer air
        is `p-4` and the 8px between label and sentence is a single `mb-2` rather
        than two paddings that happened to sum to it.

        ⚠ **`mt-1` is arithmetic, not taste.** The section's content box starts
        50px down the page; 4px of margin plus 16px of padding puts the heading's
        ink at 70 and the paragraph's first line at 92, which is exactly where
        both sat before there was a pill. Adding a container moved nothing that
        had already been settled.

        ⚠ **What it does move is horizontal.** The text is inset 16px from the
        pill's edge, so *People* no longer aligns with the left edge of type on
        every other screen. That is what a pill is rather than a band — the
        alternative is bleeding it out with a negative margin, which stops it
        being a pill.

        `w-fit max-w-sm` hugs the contents up to 24rem: on a phone that exceeds
        the column so it fills it, and on a desk it stops at the measure instead
        of running the width of the page.

        Both states wear it. A shape that arrived only once the list was empty
        would be a container that came and went with the data.

        ⚠ **`/40`, and full-strength `bg-surface` was wrong here — reported as
        "way too grey".** The token is tuned for things that are *meant* to read as
        raised off the ground: the intent sheet, the capture field, the toast. At
        full strength it is 1.29:1 against pure black, which is the whole point of
        a card and far too much for a container whose job is to group two lines of
        quiet text. At 40% it composites to #0d0d0c over the black ground —
        about 1.09:1 — which reads as a shape without reading as a panel.

        Opacity rather than a new colour, deliberately: it stays a tint of the same
        warm charcoal, so the pill cannot drift away from the palette's warmth the
        way a hand-picked near-black would. `bg-surface/60` on the search bar's back
        arrow is the same move.
      */}
      <div className="bg-surface/40 mt-1 flex w-fit max-w-sm flex-col rounded-2xl p-4">
        <h2 className="micro text-muted mb-2">People</h2>

        {/*
          ⚠ **The way in, and it belongs above the list rather than below it.**
          Somebody arriving here with a handle in their hand is doing the one
          thing this pill exists for; a field under the names would be found
          after scrolling past everyone they have already added. See
          `AddPerson` — it goes to their page and does not add anybody.
        */}
        <AddPerson />

        {people.length === 0 ? (
          <p className="text-muted text-sm">
            Nobody yet. Add someone by their handle above — there is no directory
            and no search for strangers. Ask a friend for theirs. They have to add
            you back before anything converges.
          </p>
        ) : (
          <ul className="flex flex-col">
            {people.map((person) => (
              <li key={person.userId} className="border-rule border-b last:border-b-0">
                {/*
                  `as Route` because the href is not a literal. Next's
                  typed-routes guide asks for exactly this cast on an interpolated
                  path — the handle comes out of the database, so no literal can
                  cover it.
                */}
                <Link
                  href={`/u/${person.handle}` as Route}
                  className="hover:text-muted tap-target flex items-baseline justify-between gap-3 py-4 text-lg transition-colors"
                >
                  <span className="min-w-0 truncate">{nameFor(person)}</span>

                  {/*
                    ⚠ **To the right, in the furniture's own register.** It is a
                    state and not a control, so it takes `text-muted` at the
                    label size rather than anything a thumb would aim at — §11
                    gives `--color-chrome` to controls and `--color-accent` to
                    convergence, and a pending request is neither.

                    ⚠ **Nothing is drawn for a mutual**, so the column is empty
                    on every settled row and the word only ever appears where
                    something is still outstanding.
                  */}
                  {!person.mutual && (
                    <span className="micro text-muted shrink-0">Requested</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
