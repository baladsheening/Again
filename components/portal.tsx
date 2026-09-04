'use client'

import { Ask } from './console'
import type { PortalLineView, TrackRequestView } from '@/app/actions/portal'

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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two kinds of row — the handshake, 4 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **A REQUEST DOES NOT EMPTY ON OPEN, AND THAT GENERALISES *IT EMPTIES*
 * RATHER THAN BREAKING IT.** §5's rule is *a row you have opened leaves*; the
 * true statement underneath it is **a row leaves when it has been dealt with**,
 * and for a convergence, reading it *is* dealing with it, because there is
 * nothing to answer. A request has an answer. **A request that emptied on being
 * looked at would be a request destroyed by being read.**
 *
 * ⚠ **Requests come first**, because they are the only rows in this box waiting
 * on the reader. Convergences are information and can wait.
 *
 * ⚠ **No heading over them, where the lines have one.** *Who else* exists
 * because a portal line is also a line of the record and without a word saying
 * so it is *the same list, filtered, for a reason you cannot see*. A request
 * says who is asking in its own sentence — a label above it would be the second
 * thing on the screen saying what the first already said.
 *
 * ⚠ **Still no count and no badge**, on either kind. `portal.mjs` asserts the
 * absence of digits on the door and that must go on holding.
 */
export function Portal({
  lines,
  requests,
  answering,
  onAnswer,
  loading,
  failed,
  onOpen,
  children,
}: {
  lines: PortalLineView[]
  /** Who has added you and is waiting. */
  requests: TrackRequestView[]
  /** The handle in flight, so one tap cannot become two. */
  answering: string | null
  /** `true` adds them back — the same act as the button on their page. */
  onAnswer: (handle: string, yes: boolean) => void
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
        {/*
          ⚠ **The questions, before anything that is only information.**

          ⚠ **`Ask` is the console's, reused unchanged and for the third time.**
          Its docblock says it is *one line asking the person who wrote it to
          decide something*; this is the first time the asker is somebody else,
          and nothing about the shape changes — a statement, a question, two
          answers, and both answerable by ignoring them.

          ⚠ **The statement and the question are two lines, not one.** *`@sam`
          added you.* is what happened; *Add them back?* is what is being asked.
          Yes and No against a statement would be a control whose meaning has to
          be guessed at, on the one surface in this app where guessing wrong
          lets somebody into your record.
        */}
        {requests.map((request) => (
          <div key={request.handle} className="mb-5">
            <div className="page-row">
              <span className="min-w-0 flex-1 truncate">{request.sentence}</span>
            </div>

            <Ask
              ask="Add them back?"
              onYes={() => onAnswer(request.handle, true)}
              onNo={() => onAnswer(request.handle, false)}
              busy={answering !== null}
            />
          </div>
        ))}

        {/*
          ⚠ **The heading belongs to the lines and moves with them.** With
          nothing but requests in the box there is nothing for *Who else* to
          label, and a heading over an empty list is furniture.
        */}
        {lines.length > 0 && <h2 className="stamp text-muted mb-2.5">Who else</h2>}

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
