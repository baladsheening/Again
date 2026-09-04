'use client'

import { useState, useTransition } from 'react'

import { trackAction, untrackAction } from '@/app/actions/tracks'
import type { TrackState } from '@/lib/db'

/**
 * Add somebody, on their page.
 *
 * ⚠⚠ **THE STATE IS TEXT AND THE BUTTON IS THE VERB — 4 September, and it
 * reverses this file's own founding note.** The label used to *be* the state —
 * *Requested*, *Added each other* — with the action carried only by the hover
 * and the screen-reader text. **On a handset there is no hover**, so the one
 * control that revokes somebody's access to your record read as a status and
 * removed them when tapped. *Will a reader understand what this does* is the
 * question every element answers now, and that one could not.
 *
 * Three states, the state muted beside the verb it belongs to:
 *
 *   - neither → *Add*
 *   - outbound only → *Requested* · **Withdraw**
 *   - mutual → *Added each other* · **Remove**
 *
 * ⚠ **Two elements rather than a longer word, and it costs no height** — one
 * line either way. The state is not a control and must not be inside the box;
 * the box is the only thing a tap does something to.
 *
 * ⚠ **The middle state was *Added* for an hour and is *Requested* — 4 September,
 * directed after use.** The flaw was the one written down when *Added* was
 * chosen: **it claims something happened.** *Add* is the verb, *Requested* is
 * the state it leaves behind, and *Added each other* is the state that is
 * finished. **The same word is on the row in People**, so the state of a
 * relationship reads the same in both places it appears.
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
      <div className="flex items-baseline gap-3">
        {/*
          ⚠ **Outside the box, because it is not a control.** A state inside a
          button is a button that lies about what tapping it does — and it is
          the same weight division the portal's request line uses, where the
          handle is ink and what happened to it is muted.
        */}
        {state.outbound && (
          <span className="text-muted text-sm">
            {state.mutual ? 'Added each other' : 'Requested'}
          </span>
        )}

        <button
          type="button"
          onClick={() => run(state.outbound ? 'untrack' : 'track')}
          disabled={isPending}
          className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors disabled:opacity-40"
        >
          {/*
            ⚠ **Withdraw and Remove are different acts and are named
            differently.** Withdrawing takes back a question nobody has answered;
            removing ends a relationship and takes their sight of your record
            with it. One word cannot be honest about both.
          */}
          {state.outbound ? (state.mutual ? 'Remove' : 'Withdraw') : 'Add'}
          <span className="sr-only"> @{handle}</span>
        </button>
      </div>

      {/* Full strength at body size, as everywhere else a failure is reported. */}
      {error && <p>{error}</p>}
    </div>
  )
}
