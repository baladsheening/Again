import type { Route } from 'next'
import Link from 'next/link'

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
 */
export function TrackedPeople({ people }: { people: TrackedPerson[] }) {
  return (
    <section className="flex flex-col">
      {/*
        **The label descends to its text; the text does not rise to the label.**
        The gap between them was 28px — 4px of margin plus the paragraph's own
        24px of top padding — which read as two separate things rather than a
        caption and its sentence.

        Closing it from above: 20px comes off the paragraph's top padding and goes
        onto the heading's top margin, so the paragraph's first line stays exactly
        where it was (92px down the page) and *People* drops 20px to meet it. The
        ink gap is 8px. Moving the paragraph up instead would have closed the same
        distance and taken the section's whole body with it.

        `mt-5` is unconditional, so the heading sits in the same place whether or
        not there is anyone in the list — its position is a property of the
        section, not of its contents. The populated case keeps its own 24px to the
        first row, because that 20px belongs to the row's `py-5` rhythm and is
        shared with every other list in the app.
      */}
      <h2 className="micro text-muted mt-5 mb-1">People</h2>

      {people.length === 0 ? (
        <p className="text-muted max-w-sm pt-1 pb-6 text-sm">
          Nobody yet. You reach someone by their handle — there is no directory
          and no search for strangers. Ask a friend for theirs.
        </p>
      ) : (
        <ul className="flex flex-col">
          {people.map((person) => (
            <li key={person.userId} className="border-rule border-b last:border-b-0">
              {/*
                `as Route` because the href is not a literal. Next's typed-routes
                guide asks for exactly this cast on an interpolated path — the
                handle comes out of the database, so no literal can cover it.
              */}
              <Link
                href={`/u/${person.handle}` as Route}
                className="hover:text-muted tap-target block py-5 text-lg transition-colors"
              >
                {nameFor(person)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
