'use client'

import { useState, useTransition } from 'react'

import { trackAction, untrackAction } from '@/app/actions/tracks'
import type { TrackState } from '@/lib/db'

/**
 * Track and untrack, on someone's page.
 *
 * **The button says what tracking is for, not what it is.** *Track* alone names
 * a mechanism; the state underneath it is what the person came to find out, so
 * the line below reports the relationship rather than repeating the verb. Three
 * states, and only one of them is symmetric:
 *
 *   - neither → *Track* (nothing yet)
 *   - outbound only → *Tracking* (you follow them; overlap does nothing yet)
 *   - mutual → *Tracking each other* (§6 fires, and §5 shows names)
 *
 * Inbound-only is deliberately **not** announced. Being told "they track you" is
 * a follower notification, which is the §2 shape the design avoids, and it would
 * also leak a one-sided interest the other person never chose to publish. The
 * button reads *Track* in that case, exactly as it would for a stranger — and
 * pressing it is the moment the pair becomes mutual.
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
            already reads as *Tracking* cannot also say *Untrack* without saying
            two things at once. `title` and the screen-reader text carry the verb,
            which is the same division the resolve row uses.
          */}
          <span aria-hidden>{state.mutual ? 'Tracking each other' : 'Tracking'}</span>
          <span className="sr-only">
            Stop tracking @{handle}. {state.mutual ? 'You track each other.' : 'You track them.'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => run('track')}
          disabled={isPending}
          className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors disabled:opacity-40"
        >
          Track
          <span className="sr-only"> @{handle}</span>
        </button>
      )}

      {/* Full strength at body size, as everywhere else a failure is reported. */}
      {error && <p>{error}</p>}
    </div>
  )
}
