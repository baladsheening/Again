'use client'

import { useState, useTransition } from 'react'

import { copyEntryAction } from '@/app/actions/entries'
import type { CaptureCard } from '@/lib/db'
import { specFor, STATE_WORD } from '@/lib/vocabulary'
import { TickIcon } from './icon-tick'
import { Poster, PosterReveal } from './poster'

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
 * ⚠ **The same reasoning is why this does not reuse `Console`.** That box is the
 * owner's — cross off, rewrite, settle — and the one thing to be done here is a
 * copy the owner's console never offers. A `readOnly` prop on it would be the
 * `mine` boolean again, one level up.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It is the record, read from the other side — 4 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **THE ROW WAS 111px AND THE SAME CAPTURE IS 34px ON YOUR OWN PAGE.**
 * Measured on a 390 handset: `py-7` and a hairline made 56px of the row air, an
 * *Add to wants* under every line made 32px of it a repeated control, and the
 * capture itself was 24px of the 111. Three of somebody's lines filled a screen
 * where the record fits twenty-four. Rules 3, 4 and 5 in `CLAUDE.md` were
 * written from this row.
 *
 * ⚠ **So it is `page-row`, one line, truncating** — the same box as the record
 * and the portal, which is what makes them one app rather than three screens.
 * The words are the whole row and the `aria-label` carries what an ellipsis
 * takes off the screen.
 *
 * ⚠ **A tap opens the line, as it does everywhere else**, and the panel below it
 * holds what the row cannot show: the capture in full, what is known about it,
 * and the one control. It opens **in place at every width**, which is the shape
 * the console already takes on the desk — the fixed card exists because the
 * capture page has a writing strip and a record you must keep seeing under it,
 * and this page has neither.
 *
 * ⚠ **`PosterReveal` moved into the panel with the words.** It used to wrap the
 * row, so a tap on somebody's line showed a poster where the same tap on your
 * own line opened a console — rule 5, exactly. Inside the panel it is the old
 * gesture on the old element, and the row's tap means what it means everywhere.
 *
 * ⚠ **The words are the row, and the title is not shown.** Somebody's page shows
 * what they wrote. A capture that resolved to *Jaws* still reads as the words
 * they typed, because a shared page substituting a canonical title would be
 * showing a person's friends something that person did not write — and §6 keeps
 * `text` unreplaced in the column for the same reason. The title still does the
 * work only it can do: it names the poster for a screen reader.
 *
 * ⚠ **It takes a `CaptureCard` since 24 August, and that fixed a silence.** It
 * was an `EntryCard`, built by `toLegacyEntryCards`, which drops every capture
 * that resolved to nothing — so everything typed as words on the capture page
 * was **silently absent** from the page a mutual sees: not empty, not partial,
 * just gone, with no symptom on either side.
 */
export function PersonRow({
  card,
  open,
  onOpen,
}: {
  card: CaptureCard
  open: boolean
  onOpen: () => void
}) {
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
  const known = card.year !== null || word !== null || spec !== null

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
    <li className={isPending ? 'opacity-40 transition-opacity' : 'transition-opacity'}>
      <div className="page-row">
        {/*
          ⚠ **A span with a role, not a `<button>`** — the record's own rule, for
          the record's own reason: a button brings a UA font, a centred alignment
          and a baseline of its own into a row built out of one inherited type.
        */}
        <span
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen()
            }
          }}
          aria-expanded={open}
          aria-label={card.text}
          /*
            ⚠⚠ **OPENING DROPS THE CLIP; IT DOES NOT PRINT THE WORDS A SECOND
            TIME.** The first build of this put the whole capture in the panel
            below the row, which is what the record's console does — and on the
            desk, where that console is in flow rather than over the line, **both
            copies are on screen at once**: measured at 1440, the card's top is
            45px below the row it belongs to. On a handset it is invisible
            because the card covers the row. Here there is no card to cover
            anything, so the row's own words are the whole of the capture and
            opening is the clip coming off. Rule 2, and it is one element rather
            than two agreeing.
          */
          className={`min-w-0 flex-1 ${open ? '' : 'truncate'}`}
        >
          {card.text}
        </span>
      </div>

      {open && (
        <div className="pb-4">
          {/*
            What is known about it, and nothing more. A raw capture has no year,
            no kind and no intent, so this line can be empty — and when it is, it
            is not rendered at all rather than printed as a row of em dashes.

            ⚠ **The state's word wins over the want label**, because it is the
            one a raw capture can also carry. *Again* and *Have* are the
            re-direction's words for `go_back_to` and `fixture`; a plain want
            says nothing, which is what it says on the owner's own page too.
          */}
          {(known || card.posterPath !== null) && (
            <p className="micro text-muted mt-2.5 flex items-center gap-1.5">
              {/*
                ⚠ **The picture is shown, not hidden behind the words.** It used
                to be a `PosterReveal` wrapped around the row, so a tap on
                somebody's line opened a poster where the same tap on your own
                line opens a console — rule 5. The console already stated the
                answer for its photograph: *on the row it rides the line in the
                year's slot, which is a mark saying there is one; in here it is
                the thing itself.* So it stands at the head of what is known
                about the line, at the app's one poster size, and tapping it
                still opens it full size.

                ⚠ **Only when there is one.** `Poster` draws a placeholder box
                for a null path — right on a row of films, and on a page of raw
                captures it would be an empty grey square on every line.
              */}
              {card.posterPath !== null && (
                <PosterReveal
                  posterPath={card.posterPath}
                  title={card.title ?? card.text}
                  className="me-1.5 block"
                >
                  <Poster posterPath={card.posterPath} />
                </PosterReveal>
              )}

              {card.year !== null && <span>{card.year}</span>}

              {card.year !== null && (word !== null || spec !== null) && (
                <span aria-hidden className="opacity-40">
                  ·
                </span>
              )}

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

          {/*
            ⚠ **One control, and no underline.** It is the only thing to be done
            in here, so nothing needs distinguishing from anything — and the
            underline made it louder than the capture above it when it was
            printed on every row.

            *Add* rather than *Copy*: what happens is that it joins your wants,
            and the copying is an implementation detail that only §6's
            suppression rule cares about. The state it lands in is always a want
            — see `copyEntry` — so this says the same thing on every row
            regardless of what they hold.

            ⚠ **It keeps *to wants* rather than shrinking to *Add*.** The header
            of this page carries an *Add* about the **person**; one word here
            would be two Adds on one screen meaning different things. Rule 1 over
            rule 2, and it costs nothing now that it is printed once rather than
            once per line.
          */}
          <div className="mt-3 flex flex-col items-start gap-2">
            {outcome === null ? (
              <button
                type="button"
                onClick={copy}
                disabled={isPending}
                className="text-muted hover:text-text tap-target text-sm transition-colors"
              >
                Add to wants
                <span className="sr-only">: {card.text}</span>
              </button>
            ) : (
              <p className="text-muted text-sm">
                {outcome === 'copied' ? 'Added' : 'Already in your wants'}
              </p>
            )}

            {error && <p>{error}</p>}
          </div>
        </div>
      )}
    </li>
  )
}
