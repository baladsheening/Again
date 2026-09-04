'use client'

import { useState, useTransition } from 'react'

import { trackAction, untrackAction } from '@/app/actions/tracks'
import type { TrackState } from '@/lib/db'

/**
 * Add somebody, on their page.
 *
 * **The button says what tracking is for, not what it is.** The state
 * underneath it is what the person came to find out, so the line below reports
 * the relationship rather than repeating the verb. Three states, and only one of
 * them is symmetric:
 *
 *   - neither → *Add* (nothing yet)
 *   - outbound only → *Added* (they have been asked and have not answered)
 *   - mutual → *Added each other* (§6 fires, and §5 shows names)
 *
 * ⚠⚠ **IT SAID *TRACK* / *TRACKING* UNTIL 4 SEPTEMBER, AND THE MIDDLE STATE WAS
 * A LIE.** *Tracking* claimed a live relationship. Nothing of the sort existed:
 * an outbound-only row grants no visibility, no name and no convergence, so what
 * it really described was **an offer nobody had been told about** — the whole of
 * why two accounts holding the same film converged on nothing. It is a request
 * now, and it is delivered. See `lib/db/tracks.ts` and
 * `docs/re-direction/the-handshake.md`.
 *
 * ⚠ **The screen says ADD and the code says TRACK — directed.** §4 makes the
 * vocabulary load-bearing in identifiers as well as copy, and this is the split:
 * the relation is a track, the act of asking for one is adding. `trackAction`
 * keeps its name.
 *
 * ⚠ **There is no silent one-sided track any more, and this is where that is
 * enforced** — directed, overruling §9's *one-sided tracking remains available
 * elsewhere in the product*. There is no second control, because there is
 * nothing left for it to do that this does not.
 *
 * Inbound-only is deliberately **not** announced. Being told "they track you" is
 * a follower notification, which is the §2 shape the design avoids, and it would
 * also leak a one-sided interest the other person never chose to publish. The
 * button reads *Add* in that case, exactly as it would for a stranger — and
 * pressing it is the moment the pair becomes mutual. **The request itself
 * arrives in their portal, addressed to them, which is not the same thing as a
 * page telling you who is watching.**
 *
 * No amber anywhere: §11 gives the accent to overlap state and nothing else, and
 * a relationship is not an overlap.
 */
export function TrackButton({
  handle,
  initial,
}: {
  handle: string
  initial: TrackState
}) {
  const [state, setState] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(next: 'track' | 'untrack') {
    setError(null)
    startTransition(async () => {
      const result = await (next === 'track' ? trackAction(handle) : untrackAction(handle))
      if (result.ok) setState(result.state)
      else setError(result.message)
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {state.outbound ? (
        <button
          type="button"
          onClick={() => run('untrack')}
          disabled={isPending}
          className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors disabled:opacity-40"
        >
          {/*
            The label is the state and the action is the hover — a control that
            already reads as *Added* cannot also say *Remove* without saying two
            things at once. The screen-reader text carries the verb, which is the
            same division the resolve row uses.
          */}
          <span aria-hidden>{state.mutual ? 'Added each other' : 'Added'}</span>
          {/*
            ⚠ **The unanswered case is said here and nowhere else.** *Added* on
            its own is the state; what a reader cannot see is that it is still
            waiting, and the one place to say so without putting a second line
            of copy on the page is the label a screen reader gets — which is the
            same division the label above already uses for the verb.
          */}
          <span className="sr-only">
            Remove @{handle}.{' '}
            {state.mutual ? 'You have added each other.' : 'They have not answered yet.'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run('track')}
          disabled={isPending}
          className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors disabled:opacity-40"
        >
          Add
          <span className="sr-only"> @{handle}</span>
        </button>
      )}

      {/* Full strength at body size, as everywhere else a failure is reported. */}
      {error && <p>{error}</p>}
    </div>
  )
}
