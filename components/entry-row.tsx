'use client'

import { useState, useTransition } from 'react'

import {
  incrementReturnAction,
  resolveEntryAction,
} from '@/app/actions/entries'
// Type-only, so it is erased at compile time and `server-only` never reaches
// the client bundle. @/lib/db is the sanctioned entry point (eslint bans the
// client and schema modules, not this).
import type { OwnerView } from '@/lib/db'
import type { EntryCard } from '@/lib/domain'
import { specFor } from '@/lib/vocabulary'
import { TickIcon } from './icon-tick'
import { Poster } from './poster'
import { ReturnCount } from './return-count'

/**
 * One row of the live list, plus the resolve flow (§8): a single tap to
 * resolve, then a single question. No check-ins, no location, no rating.
 *
 * `view` is which collection the row is being shown in, and three things depend
 * on it. The row cannot infer it from `card.state`, because a go-back-to appears
 * in two places — the live list, where it needs distinguishing from an unwatched
 * want, and its own tab, where everything around it is the same thing.
 */
export function EntryRow({
  card,
  pending = false,
  view = 'live',
}: {
  card: EntryCard
  pending?: boolean
  view?: OwnerView
}) {
  const spec = specFor(card.kind, card.intent)
  const satisfied = card.state === 'go_back_to'
  const [asking, setAsking] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const busy = pending || isPending

  function resolve(keep: boolean) {
    setAsking(false)
    setError(null)
    startTransition(async () => {
      const result = await resolveEntryAction(card.id, keep)
      if (!result.ok) setError(result.message)
    })
  }

  function beenBack() {
    setError(null)
    startTransition(async () => {
      const result = await incrementReturnAction(card.id)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <li
      className={`border-rule flex flex-col border-b py-3 ${busy ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Poster posterPath={card.posterPath} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/*
            One flowing line: the title in full, then a middle dot, then the
            year. It wraps rather than truncating.

            The title used to be `truncate`, which cut long ones off with an
            ellipsis — and an ellipsis here promises nothing, because there is no
            tap to expand and no tooltip. It was simply hiding the name of the
            film on the rows most likely to need reading.

            `·` (U+00B7) rather than a full stop: it sits on the middle of the
            line where a separator belongs, instead of on the baseline where it
            reads as the end of a sentence.
          */}
          <p className="leading-snug">
            {card.title}
            <span className="text-muted">
              <span className="mx-1.5 opacity-40">·</span>
              {card.year ?? '—'}
            </span>
          </p>

          {/*
            The want label states an intention, so it goes when the intention is
            met. It used to render on every state: "Want to see" sat under a
            go-back-to beside its return count, and under an archived film nobody
            wants any more. A resolved row now has no second line at all.
          */}
          {card.state === 'want' && (
            <p className="text-muted text-xs">{spec.wantLabel}</p>
          )}

          {card.state === 'want' && !asking && (
            <button
              type="button"
              onClick={() => setAsking(true)}
              disabled={busy}
              className="text-muted hover:text-text tap-target mt-2 self-start text-sm underline underline-offset-4 transition-colors"
            >
              {spec.resolveAction}
            </button>
          )}

          {/*
            gap-5 rather than gap-4 on touch: Yes and No both carry a 44px hit
            area, and at gap-4 the two expansions meet in the middle. This is the
            one place in the app where a mistap does something you cannot undo
            after ten seconds, so the gap is not cosmetic.
          */}
          {asking && (
            <div className="mt-2 flex flex-wrap items-center gap-4 pointer-coarse:gap-5">
              <span className="text-sm">{spec.question}</span>
              <button
                type="button"
                onClick={() => resolve(true)}
                className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => resolve(false)}
                className="text-muted hover:text-text tap-target text-sm transition-colors"
              >
                No
              </button>
            </div>
          )}

          {/*
            Only where the count is. This increments the return count, and the
            count now lives on the go-back-tos collection — offered in the live
            list it would change a number that is not on screen, which is a tap
            with no feedback at all.
          */}
          {view === 'go_back_tos' && satisfied && spec.returnAgainLabel && (
            <button
              type="button"
              onClick={beenBack}
              disabled={busy}
              className="text-muted hover:text-text tap-target mt-2 self-start text-sm underline underline-offset-4 transition-colors"
            >
              {spec.returnAgainLabel}
            </button>
          )}

          {error && <p className="text-muted mt-1 text-xs">{error}</p>}
        </div>

        {/*
          The count belongs to its own collection, where a column of numerals
          sorted by size explains itself. The tick does the work in the live
          list, where the question is only "have I watched this or not".
        */}
        {view === 'go_back_tos' && satisfied && (
          <ReturnCount count={card.returnCount} label={spec.countLabel} />
        )}

        {view === 'live' && satisfied && (
          <span className="text-muted flex shrink-0 items-center">
            <TickIcon />
            <span className="sr-only">{spec.countLabel ?? 'Resolved'}</span>
          </span>
        )}
      </div>
    </li>
  )
}
