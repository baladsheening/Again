'use client'

import { useState, useTransition } from 'react'

import { dropEntryAction, resolveEntryAction } from '@/app/actions/entries'
// Type-only, so it is erased at compile time and `server-only` never reaches
// the client bundle. @/lib/db is the sanctioned entry point (eslint bans the
// client and schema modules, not this).
import type { OwnerView } from '@/lib/db'
import type { EntryCard } from '@/lib/domain'
import { specFor } from '@/lib/vocabulary'
import { TickIcon } from './icon-tick'
import { PosterReveal } from './poster'

/**
 * One row of a collection, plus the resolve flow (§8): a single tap to resolve,
 * then a single question. No check-ins, no location, no rating.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The row is type and nothing else (9 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The title is the largest thing on the screen and the metadata is the smallest,
 * a little over 2:1 apart. That ratio is the entire design of this row and it is
 * what §11 has been asking for from the start — the old row set the title, the
 * year, the label and the button within three pixels of each other, so nothing
 * was more important than anything else and the whole list read as one flat
 * grey block.
 *
 * The 32px poster thumbnail is gone with it. See `components/poster.tsx` for
 * where the artwork went and why.
 *
 * `view` is which collection the row is being shown in. A go-back-to appears in
 * two places — the live list, where it needs distinguishing from an unwatched
 * want, and its own collection, where everything around it is the same thing —
 * so the row cannot infer its context from `card.state`.
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
    No confirmation, and no question after it. *Seen it* asks one because it has
    two answers; this has one, and a *sure?* on a single-answer control is a
    dialog that exists to be dismissed.

    It is also the one resolution you can take back without the ten-second
    window: wanting the film again revives this row rather than making a new one
    (`addEntry`), so a mistap costs a search rather than a record.
  */
  function drop() {
    setError(null)
    startTransition(async () => {
      const result = await dropEntryAction(card.id)
      if (!result.ok) setError(result.message)
    })
  }

  /*
    A hairline between rows, which is a reversal — they were removed on 8 August
    because "a border under every item drew a horizontal line every three lines
    of text and turned a short list into a table".

    That was true at the spacing it was written about: 12px of padding, so the
    rule sat closer to the text than the text sat to itself, and read as a cell
    boundary. At 28px it does the opposite — the space is the separator and the
    rule is a measure, which is what a hairline does on a printed page. §11's
    own palette calls `--color-rule` an editorial divider; this is that use.

    `last:border-b-0` so the list ends on text rather than on a line pointing at
    nothing.
  */
  return (
    <li
      className={`border-rule flex flex-col gap-3 border-b py-7 transition-opacity last:border-b-0 lg:flex-row lg:items-start lg:gap-10 ${
        busy ? 'opacity-40' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        {/*
          Tapping the title opens the poster full-bleed. It is the only route to
          the artwork now that the thumbnail has gone — see `poster.tsx`.
        */}
        <PosterReveal posterPath={card.posterPath} title={card.title} className="title block">
          {card.title}
        </PosterReveal>

        {/*
          Year, then what you want with it. The separator is `·` (U+00B7) rather
          than a full stop: it sits on the middle of the line where a separator
          belongs, instead of on the baseline where it reads as the end of a
          sentence.

          The want label states an intention, so it goes when the intention is
          met — it used to render on every state, so "Want to see" sat under a
          film nobody wanted any more. What replaces it on a satisfied row is
          the tick, and in every other collection nothing replaces it, because
          the collection has already said what these are.
        */}
        <p className="micro text-muted mt-2.5 flex items-center gap-1.5">
          <span>{card.year ?? '—'}</span>

          {card.state === 'want' && (
            <>
              <span aria-hidden className="opacity-40">
                ·
              </span>
              <span>{spec.wantLabel}</span>
            </>
          )}

          {view === 'live' && satisfied && (
            <>
              <TickIcon />
              <span className="sr-only">{spec.resolveAction}</span>
            </>
          )}
        </p>
      </div>

      {/*
        The action column. On a phone it stacks under the title; from `lg` it
        moves to the right of the row, which is what gives the desk-width layout
        something to do with its measure other than set longer lines.

        Nothing renders here outside the live list — a resolved entry has no
        action left, so those rows are a title and a year.

        ⚠ **`gap-6` on touch, and the number comes from `tap-target`.** That
        utility grows a 44px hit area around each control on a coarse pointer,
        centred on text about 20px tall — so each one reaches roughly 12px past
        its own line, and the two stacked controls below need 24px between them
        or their expansions overlap and the lower one silently wins the middle.
        This is the same fault the Yes/No pair is spaced for, in the axis the
        column stacks on. It is derived rather than tuned: change the 44 and this
        should change with it.
      */}
      {(card.state === 'want' || error) && (
        <div className="flex flex-col items-start gap-2 pointer-coarse:gap-6 lg:shrink-0 lg:items-end">
          {/*
            **Two exits, and they are deliberately the same size — 21 August.**

            A want can end two ways and until now the row only admitted one of
            them. *Seen it* asks the §8 question; *Not any more* says the
            intention lapsed and files the row under `dropped` (§5.1 — a
            resolution, not a delete). Before this, the only way out of a want
            you had gone off was to claim you had watched it, which put a false
            row in the archive; docs/decisions.md carries the argument.

            ⚠ **The second one is not set smaller, and that is a decision.**
            `text-xs`/`micro` is the quietest value in the system and this file
            already reserves it for de-emphasised metadata — see the note on the
            error message below, which was moved *up* out of it for that reason.
            A control set in the metadata size reads as a caption. So both are
            `text-sm text-muted` and the ordering carries the hierarchy: the
            usual answer first, the unusual one under it.

            Neither is destructive on the first tap — this one changes a state
            that wanting the film again reverses (see `addEntry`), and that one
            only opens the question — so nothing here needs the spacing the
            Yes/No pair below is given.
          */}
          {card.state === 'want' && !asking && (
            <>
              <button
                type="button"
                onClick={() => setAsking(true)}
                disabled={busy}
                className="text-muted hover:text-text tap-target text-sm underline underline-offset-4 transition-colors"
              >
                {spec.resolveAction}
              </button>
              <button
                type="button"
                onClick={drop}
                disabled={busy}
                className="text-muted hover:text-text tap-target text-sm underline underline-offset-4 transition-colors"
              >
                Not any more
              </button>
            </>
          )}

          {/*
            gap-5 rather than gap-4 on touch: Yes and No both carry a 44px hit
            area, and at gap-4 the two expansions meet in the middle. This is the
            one place in the app where a mistap does something you cannot undo
            after ten seconds, so the gap is not cosmetic.
          */}
          {asking && (
            <div className="flex flex-wrap items-center gap-4 pointer-coarse:gap-5">
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
            Full strength, at body size. This is a failure message and it used to
            be set `text-muted text-xs` — the quietest value in the system, the
            one reserved for de-emphasised metadata. §11 rules out the accent for
            this (it marks overlap and nothing else) and there is no error colour
            in the palette, so weight and size carry it instead. Decided
            8 August; see docs/decisions.md.
          */}
          {error && <p className="lg:text-end">{error}</p>}
        </div>
      )}
    </li>
  )
}
