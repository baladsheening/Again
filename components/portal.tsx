'use client'

import type { PortalLineView } from '@/app/actions/portal'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The portal — 30 August, Phase 2 step 3
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **What happened while you were away.** The first surface in this app that
 * reads `notifications`, and therefore the first end-to-end proof that
 * `lib/overlap.ts` — deployed and running since Phase 2's engine landed — writes
 * anything anybody can see.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  A list of LINES, not a list of events
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Every row is a capture exactly as it reads in the record, plus one
 * sentence.** That is §5 of `phase-2-convergence.md` and it is enforced in the
 * read — two people converging on one line is one row naming both, not two rows
 * saying the same thing twice. See `listMyPortal`.
 *
 * ⚠ **The sentence arrives written.** The tense is the product — *Sam too.*,
 * *Sam has.*, *Sam wants to.* — and `portalSentence` in `lib/overlap.ts` is its
 * one author, beside the copy it must not drift from. Nothing here knows what a
 * convergence is; it renders a string.
 *
 * ⚠ **The rows are the record's own type and the sentence is `--color-muted`.**
 * The capture is the thing; the sentence is what happened to it. Drawing them
 * at one weight would make the portal a list of announcements with captures
 * attached, which is the inversion the brief's *a list of lines* rules out.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It empties
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **A row you have opened leaves, and there is no *mark as read*.** §5 rules
 * that out by name: a portal you can clear in one gesture is a count with extra
 * steps. Opening a line is the only thing that empties it.
 *
 * ⚠ **It leaves on the NEXT arrival, not under the finger.** Tapping a row marks
 * it read and opens its console; the row stays on screen while the console is
 * open, because a list that reflowed at the moment of the tap would move the
 * thing being opened. The portal is re-read every time it opens, so the row is
 * gone the next time somebody looks — which is exactly what *what happened while
 * I was away* means.
 *
 * ⚠ **Nothing here explains an absence.** §6: *silence stays silent* — no *no
 * matches yet*, no empty state for convergence. An empty portal cannot be
 * opened at all, because the door is off when there is nothing behind it, so
 * this component never renders a zero case and must not grow one.
 */
export function Portal({
  lines,
  loading,
  failed,
  onOpen,
  children,
}: {
  lines: PortalLineView[]
  /** The read is out. There is nothing to draw yet and nothing to say about it. */
  loading: boolean
  /** The read failed, in the page's own voice. */
  failed: string | null
  onOpen: (line: PortalLineView) => void
  /**
   * The console for whichever row is open, rendered by the page.
   *
   * ⚠ **A render prop, because the console's controls are the PAGE's.** Cross
   * off, rewrite and settle all act on a capture through handlers that own the
   * record's list and the writing strip; a portal that built its own set would
   * be a second implementation of every mutation on this screen. So the portal
   * decides *where* a console goes and the page decides *what it does* — which
   * is the same division `page-screen.tsx` already has with the record.
   */
  children: (line: PortalLineView) => React.ReactNode
}) {
  return (
    <div className="portal-sheet z-10">
      <div className="portal-card">
        {/*
          ⚠ **A heading, on a page that refuses copy everywhere else.** The
          record needs none — the caret is the instruction and the words are the
          content — but this box arrives over the record holding lines that are
          also in the record, and without a word saying so it is *the same list,
          filtered, for a reason you cannot see*. The smallest honest label is
          what is behind it, which is the argument *Earlier* won at the foot of
          the record.

          ⚠ **In the day stamps' own type**, mono and muted: this is furniture,
          and it is the third thing that furniture does rather than a fourth use
          of a scarce face.
        */}
        <h2 className="stamp text-muted mb-2.5">Who else</h2>

        <ol className="portal-list">
          {failed !== null && <li className="page-line">{failed}</li>}

          {lines.map((line) => (
            <li key={line.id}>
              {/*
                ⚠ **The same `page-row` box as the record**, so a line is the
                same height, the same type and the same 44px target in both
                places. A portal row that looked like a notification would be a
                second way of drawing a capture.
              */}
              <div className="page-row">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(line)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpen(line)
                    }
                  }}
                  /*
                    ⚠ **A span with a role, not a `<button>`** — the record's own
                    rule, for the record's own reason: a button brings a UA font,
                    a centred alignment and a baseline of its own into a row
                    built out of one inherited type.
                  */
                  aria-label={`${line.text}. ${line.sentence}`}
                  className="min-w-0 flex-1 truncate"
                >
                  {line.text}
                </span>
              </div>

              {/*
                ⚠ **The sentence is under the line, not beside it.** Beside it,
                the two would compete for the one line's width and the sentence
                would be the first thing an ellipsis ate — and the sentence is
                the only thing on this surface that the record does not already
                say.
              */}
              <p className="text-muted mb-2.5 text-[0.8125rem]">{line.sentence}</p>

              {children(line)}
            </li>
          ))}
        </ol>

        {/*
          Loading says nothing and draws nothing: the read is one query behind a
          tap, and a spinner on a box that is already open is a second thing to
          look at. If it is slow the card is briefly a heading, which is honest.
        */}
        {loading && lines.length === 0 && <p className="page-line text-muted" aria-busy />}
      </div>
    </div>
  )
}
