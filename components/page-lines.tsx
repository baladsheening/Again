import { LockGlyph } from './glyphs'
import type { PageLineView } from '@/lib/page-line'
import { STATE_WORD } from '@/lib/vocabulary'

/**
 * **Lines of the record, drawn where nothing acts on them.**
 *
 * ⚠⚠ **EXTRACTED FROM `search-screen.tsx` ON 12 SEPTEMBER, VERBATIM, BECAUSE A
 * SECOND SURFACE NEEDED IT.** Home now shows the record under its composer, and
 * a second copy of this markup would be **design rule 3 broken by
 * construction** — *one object has one height wherever it appears*. There is
 * one row now and two callers.
 *
 * ⚠ **No `'use client'`, and that is what lets both have it.** The markup holds
 * no state and no handler, so it compiles into whichever tree imports it:
 * `SearchScreen` is a client component and pulls it into the bundle, the front
 * page is a server component and renders it to markup that never crosses the
 * boundary. **Do not add a hook to this file** — the day it needs one, home
 * pays for search's interactivity.
 *
 * ⚠⚠ **A ROW, NOT A BUTTON, ON BOTH SURFACES.** Nothing here acts on a line: a
 * console only exists where the record is — `foot.tsx`'s own words about the
 * portal's door, and the reason that door navigates rather than opening a box
 * it cannot fill. **A control that cannot act is worse than no control, because
 * it looks like one.**
 */
export function PageLines({
  lines,
  className = '',
}: {
  lines: readonly PageLineView[]
  /**
   * ⚠ **The air above the FIRST stamp belongs to the caller, not to the list.**
   * Search leads with `mt-6` under its field; the front page leads with
   * `<main>`'s own `--page-lead` under the bar. A list that declared its own
   * lead would be a number two screens had to agree about.
   */
  className?: string
}) {
  return (
    <ol className={`flex flex-col ${className}`}>
      {lines.map((line, i) => {
        const stamped = i === 0 || lines[i - 1].day !== line.day
        const crossedOff = line.state === 'dropped'
        const word = STATE_WORD[line.state]
        return (
          <li key={line.id}>
            {stamped && (
              <p className={`stamp text-muted mb-2.5 ${i === 0 ? '' : 'mt-[26px]'}`}>
                {line.dayLabel}
              </p>
            )}
            {/*
              ⚠ **The mark travels here — 31 August.** A result is a line of the
              record, and *why is this line special* is exactly the question
              somebody has when a search hands back something they wrote in
              June. It draws nothing on a line that has not converged, so a
              record with no convergences in it looks exactly as it did.

              ⚠ **A struck result draws none either, and there is no term for it
              here** — `converged` answers false for a crossed-off line since 12
              September. Nothing on this surface acts on a line, so there is no
              optimistic state to mirror and the read is the whole answer; the
              record holds the term as well only because a cross-off there
              deliberately does not refresh.

              ⚠ **The mark is the only thing on this surface that is not already
              text**, so it is the one thing a reader could miss; the row's own
              words carry it in the label the same way the record's do. There is
              no console here to say *who* — nothing on this surface acts on a
              line — so the mark says *there is something* and the record is
              where it is read.
            */}
            <div
              className={`page-line flex items-baseline ${line.converged ? 'converged' : ''}`}
            >
              {/*
                ⚠⚠ **`min-w-0 truncate`, AND THIS ROW WENT OUT WITHOUT IT — 12
                September, reported: *why on the home page can I scroll
                horizontally unlike on the record page?*** Because this markup
                came from `search-screen.tsx`, which had `min-w-0 flex-1` and no
                truncation, and **search's row was never measured against the
                record's box.** A capture with one long unbroken token has
                nothing to wrap at, so it ran past the gutter and took the
                document's width with it.

                ⚠ **The record's own rule since 28 August: *the record is an
                index, not a document. Every line truncates to one line.*** That
                is what `page-row` has always done — `truncate` is nowrap,
                clipped, with an ellipsis, and `min-w-0` is what lets a flex item
                shrink below its content so the clip can happen at all. **Both or
                neither.**

                ⚠ **`flex-1` is GONE with it**, and it was the second divergence:
                growing to fill pushed the year and the lock to the far right
                edge, where the record draws them immediately after the words.
                One object, one arrangement.
              */}
              <span className={`min-w-0 truncate ${crossedOff ? 'line-through opacity-50' : ''}`}>
                {line.text}
                {/*
                  ⚠ **Hidden text, not an `aria-label`.** There is no control on
                  this row — an `aria-label` on a generic element is ignored by
                  most of what would read it — so the mark is said the only way a
                  plain row can say anything: in the row.
                */}
                {line.converged && <span className="sr-only">. Also on someone else’s page.</span>}
                {/*
                  ⚠ **The lock travels here too, and it goes when the line is
                  struck** — *what the screen shows, the label says*, which cuts
                  both ways.
                */}
                {!crossedOff && !line.shared && <span className="sr-only">. Locked.</span>}
              </span>
              {/*
                ⚠⚠ **THE YEAR IS A SIBLING, NOT A CHILD OF THE TRUNCATING SPAN.**
                Inside it, a long capture eats its own year before it eats any of
                its own words — the ellipsis lands after the text and the year is
                simply gone. The record has always drawn it beside the words for
                this reason. `shrink-0`, so the words give up width and the year
                does not.
              */}
              {line.year !== null && (
                <span className="text-muted ms-2 shrink-0 text-[0.8125rem] leading-none">
                  {line.year}
                </span>
              )}
              {/*
                ⚠⚠ **NO PADLOCK ON A CROSSED-OFF LINE — 12 September, reported:
                *why should crossed out entries have locks?*** It is 12
                September's own ruling about the mark, arriving at the other
                glyph in the same row: **a struck line converges with nobody** —
                `lib/overlap.ts`'s allowlist names no `dropped` row — so whether
                it is held out of the pool has no consequence while it is struck.
                **A mark for a state that can do nothing is furniture.** ⚠ **The
                record draws it under the same condition**, so the two cannot
                disagree; see `page-screen.tsx`.

                ⚠ **Nothing is destroyed**, exactly as the mark's removal was
                not: `shared` is untouched on the row, so putting the line back
                brings the padlock back with it.

                ⚠ **`self-center`, because this row is `items-baseline`.** A
                drawing has no baseline worth aligning to, and the flex item says
                so for itself rather than the row being re-aligned around it. See
                `line-glyph` on the record, which solves the same thing the other
                way because a record row is a line box.
              */}
              {!crossedOff && !line.shared && (
                <span
                  aria-hidden
                  className="text-muted ms-2 inline-flex shrink-0 self-center [--glyph:0.875rem]"
                >
                  <LockGlyph />
                </span>
              )}
              {/*
                The word the state is called on screen, as the tray sets it.
                `null` is a word too: a live want says nothing, because a result
                that is still on the page needs no label to say so.
              */}
              {word !== null && <span className="micro text-muted ms-2 shrink-0">{word}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
