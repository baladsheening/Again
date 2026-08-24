'use client'

import { useState, useTransition } from 'react'

import { copyEntryAction } from '@/app/actions/entries'
import type { CaptureCard } from '@/lib/db'
import { specFor, STATE_WORD } from '@/lib/vocabulary'
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
 * ─────────────────────────────────────────────────────────────────────────────
 *  It takes a `CaptureCard` since 24 August, and that fixed a silence
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **It was an `EntryCard`, built by `toLegacyEntryCards`, which drops every
 * capture that resolved to nothing.** That was harmless while every write came
 * through the film flow and resolved a TMDB row first — and it stopped being
 * harmless the day raw capture shipped. Everything typed as words on the capture
 * page was **silently absent** from the page a mutual sees: not empty, not
 * partial, just gone, with no symptom on either side. `CaptureCard` carries the
 * text, so a raw capture is an ordinary row.
 *
 * ⚠ **The words are the row, and the title is not shown.** Somebody's page shows
 * what they wrote. A capture that resolved to *Jaws* still reads as the words
 * they typed, because a shared page substituting a canonical title would be
 * showing a person's friends something that person did not write — and §6 keeps
 * `text` unreplaced in the column for the same reason. The title still does the
 * work only it can do: it names the poster for a screen reader.
 *
 * ⚠ **And they are set as lines rather than as titles.** The row used to be
 * `title` — the largest type in the app — because every row was a film. A
 * one-line capture at that size is a headline made out of a note. `page-line` is
 * the record's own geometry, which is what these are.
 */
export function PersonRow({ card }: { card: CaptureCard }) {
  /*
    ⚠ **`specFor` throws on a raw capture, and it is right to.** Intent is a
    property of the entry and `kind` comes from a possibility; a capture with
    neither has no want label, and §3's derivation answers `(null, null)` by
    saying nothing at all. So it is only asked when there is something to ask
    about — which is what a `null` spec means below.
  */
  const spec = card.kind !== null && card.intent !== null ? specFor(card.kind, card.intent) : null
  /* The word the state is called on screen — `null` for a plain want. */
  const word = STATE_WORD[card.state]
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
        {/*
          `title` is the poster's name, not the row's text — see the head of this
          file. It falls back to the words when nothing resolved, so the alt text
          is never empty and the reveal never has to be conditional.
        */}
        <PosterReveal
          posterPath={card.posterPath}
          title={card.title ?? card.text}
          className="page-line block"
        >
          {card.text}
        </PosterReveal>

        {/*
          What is known about it, and nothing more. A raw capture has no year, no
          kind and no intent, so this line can be empty — and when it is, it is
          not rendered at all rather than printed as a row of em dashes. The old
          row showed `—` for a missing year because a missing year was the
          exception; on a page of raw captures it would be the rule.
        */}
        {(card.year !== null || word !== null || spec !== null) && (
          <p className="micro text-muted mt-2.5 flex items-center gap-1.5">
            {card.year !== null && <span>{card.year}</span>}

            {card.year !== null && (word !== null || spec !== null) && (
              <span aria-hidden className="opacity-40">
                ·
              </span>
            )}

            {/*
              What they want with it, or — for a go-back-to — that they have been.
              On your own list the want label goes once the want is met, because
              the collection you are standing in has already said what these are.
              Here there is no collection around it: this is a mixed list
              belonging to somebody else, so each row has to say what it is.

              ⚠ **The state's word wins over the want label**, because it is the
              one a raw capture can also carry. *Again* and *Have* are the
              re-direction's words for `go_back_to` and `fixture`; a plain want
              says nothing, which is what it says on the owner's own page too.
            */}
            {word !== null ? (
              <>
                {card.state === 'go_back_to' && <TickIcon />}
                <span>{word}</span>
              </>
            ) : (
              spec !== null && <span>{spec.wantLabel}</span>
            )}
          </p>
        )}
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
            <span className="sr-only">: {card.text}</span>
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
