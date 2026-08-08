'use client'

import { useState, useTransition } from 'react'

import { resolveEntryAction } from '@/app/actions/entries'
// Type-only, so it is erased at compile time and `server-only` never reaches
// the client bundle. @/lib/db is the sanctioned entry point (eslint bans the
// client and schema modules, not this).
import type { OwnerView } from '@/lib/db'
import type { EntryCard } from '@/lib/domain'
import { specFor } from '@/lib/vocabulary'
import { TickIcon } from './icon-tick'
import { Poster } from './poster'

/**
 * One row of the live list, plus the resolve flow (§8): a single tap to
 * resolve, then a single question. No check-ins, no location, no rating.
 *
 * `view` is which collection the row is being shown in. A go-back-to appears in
 * two places — the live list, where it needs distinguishing from an unwatched
 * want, and its own tab, where everything around it is the same thing — so the
 * row cannot infer its context from `card.state`.
 *
 * **There is no return count and no increment.** Both were removed on 8 August;
 * `docs/decisions.md` carries the reasoning and what it costs.
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


  /*
    No rule between rows. A border under every item drew a horizontal line every
    three lines of text and turned a short list into a table — and the rows were
    never ambiguous: a poster starts each one, and the space does the separating.
    §11 asks for type to be the design, and a divider is not type.

    `py-3` stays, so the gap between rows is unchanged at 24px; the only thing
    removed is the line drawn through it.
  */
  return (
    <li className={`flex flex-col py-3 ${busy ? 'opacity-50' : ''}`}>
      {/*
        The thumbnail is centred on the title line, not on the row.

        `items-center` on the whole row would only be right for a resolved entry,
        where the title is all there is. A want carries a label and a button
        underneath, and centring against that taller block floats the thumbnail
        down beside "Want to see" — related to the wrong thing. So the title line
        is its own flex row, and everything else stacks below it.
      */}
      <div className="flex items-center gap-3">
        <Poster posterPath={card.posterPath} />

        {/*
          One flowing line: the title in full, then a middle dot, then the year.
          It wraps rather than truncating.

          The title used to be `truncate`, which cut long ones off with an
          ellipsis — and an ellipsis here promises nothing, because there is no
          tap to expand and no tooltip. It was simply hiding the name of the film
          on the rows most likely to need reading.

          `·` (U+00B7) rather than a full stop: it sits on the middle of the line
          where a separator belongs, instead of on the baseline where it reads as
          the end of a sentence.
        */}
        <p className="min-w-0 flex-1 leading-snug">
          {card.title}
          <span className="text-muted">
            <span className="mx-1.5 opacity-40">·</span>
            {card.year ?? '—'}
          </span>
        </p>

        {/*
          The tick marks a want that has been satisfied, in the live list where
          it sits among wants that have not been. On the go-back-tos tab there is
          nothing to distinguish — everything there is the same thing.
        */}
        {view === 'live' && satisfied && (
          <span className="text-muted flex shrink-0 items-center">
            <TickIcon />
            <span className="sr-only">{spec.resolveAction}</span>
          </span>
        )}
      </div>

      {/*
        Everything below the title, indented to line up under it: 32px of
        thumbnail plus the 12px gap. Nothing renders here for a resolved entry,
        so those rows are a single line.
      */}
      {(card.state === 'want' || error) && (
        <div className="pl-11">
          {/*
            The want label states an intention, so it goes when the intention is
            met. It used to render on every state: "Want to see" sat under a
            go-back-to beside its return count, and under an archived film nobody
            wants any more.
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

          {error && <p className="text-muted mt-1 text-xs">{error}</p>}
        </div>
      )}
    </li>
  )
}
