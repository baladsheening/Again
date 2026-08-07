'use client'

import { useState, useTransition } from 'react'

import {
  incrementReturnAction,
  resolveEntryAction,
} from '@/app/actions/entries'
import type { EntryCard } from '@/lib/domain'
import { specFor } from '@/lib/vocabulary'
import { Poster } from './poster'
import { ReturnCount } from './return-count'

/**
 * One row of the live list, plus the resolve flow (§8): a single tap to
 * resolve, then a single question. No check-ins, no location, no rating.
 */
export function EntryRow({ card, pending = false }: { card: EntryCard; pending?: boolean }) {
  const spec = specFor(card.kind, card.intent)
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
          <p className="truncate leading-snug">{card.title}</p>
          <p className="text-muted text-xs">
            {card.year ?? '—'}
            <span className="mx-1.5 opacity-40">/</span>
            {spec.wantLabel}
          </p>

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

          {card.state === 'go_back_to' && spec.returnAgainLabel && (
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

        {card.state === 'go_back_to' && <ReturnCount count={card.returnCount} />}
      </div>
    </li>
  )
}
