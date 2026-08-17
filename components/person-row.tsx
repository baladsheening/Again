'use client'

import { useState, useTransition } from 'react'

import { copyEntryAction } from '@/app/actions/entries'
import type { EntryCard } from '@/lib/domain'
import { specFor } from '@/lib/vocabulary'
import { TickIcon } from './icon-tick'
import { PosterReveal } from './poster'

/**
 * One row of somebody else's list.
 *
 * ⚠ **Deliberately not `EntryRow` with a flag.** The two rows differ by which
 * actions they may offer, and that is exactly the difference §5 cares about: a
 * public row must be structurally incapable of rendering *Seen it*, and the way
 * to guarantee that is for the component not to import the action at all. A
 * shared row with a `mine` prop would put the owner's flow one boolean away from
 * a page it must never appear on, and that boolean would be passed from a page
 * whose author had forgotten why it mattered.
 *
 * The type ratio, the hairline and the poster reveal are the shared half, and
 * they are shared by being the same classes rather than the same component — see
 * `components/entry-row.tsx`, where they are explained.
 */
export function PersonRow({ card }: { card: EntryCard }) {
  const spec = specFor(card.kind, card.intent)
  const [isPending, startTransition] = useTransition()
  const [outcome, setOutcome] = useState<'copied' | 'already' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function copy() {
    setError(null)
    startTransition(async () => {
      const result = await copyEntryAction(card.id)
      if (!result.ok) setError(result.message)
      // `created: false` is the idempotent path — they had it already. Saying so
      // is the difference between a button that worked and one that did nothing.
      else setOutcome(result.value.created ? 'copied' : 'already')
    })
  }

  return (
    <li
      className={`border-rule flex flex-col gap-3 border-b py-7 transition-opacity last:border-b-0 lg:flex-row lg:items-start lg:gap-10 ${
        isPending ? 'opacity-40' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <PosterReveal posterPath={card.posterPath} title={card.title} className="title block">
          {card.title}
        </PosterReveal>

        <p className="micro text-muted mt-2.5 flex items-center gap-1.5">
          <span>{card.year ?? '—'}</span>

          {/*
            What they want with it, or — for a go-back-to — that they have been.
            On your own list the want label goes once the want is met, because the
            collection you are standing in has already said what these are. Here
            there is no collection around it: this is a mixed list belonging to
            somebody else, so each row has to say what it is.
          */}
          <span aria-hidden className="opacity-40">
            ·
          </span>
          {card.state === 'go_back_to' ? (
            <>
              <TickIcon />
              <span>Would go back</span>
            </>
          ) : (
            <span>{spec.wantLabel}</span>
          )}
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 lg:shrink-0 lg:items-end">
        {outcome === null ? (
          <button
            type="button"
            onClick={copy}
            disabled={isPending}
            className="text-muted hover:text-text tap-target text-sm underline underline-offset-4 transition-colors"
          >
            {/*
              *Add* rather than *Copy*: what happens is that it joins your wants,
              and the copying is an implementation detail that only §6's
              suppression rule cares about. The state it lands in is always a want
              — see `copyEntry` — so this says the same thing on every row
              regardless of what they hold.
            */}
            Add to wants
            <span className="sr-only">: {card.title}</span>
          </button>
        ) : (
          <p className="text-muted text-sm">
            {outcome === 'copied' ? 'Added' : 'Already in your wants'}
          </p>
        )}

        {error && <p className="lg:text-end">{error}</p>}
      </div>
    </li>
  )
}
