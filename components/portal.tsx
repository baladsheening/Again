'use client'

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
 * ⚠ **A DECLINED REQUEST LEAVES A LINE BEHIND, AND ONLY UNTIL THE BOX CLOSES —
 * 4 September.** It is the one thing in this card that nothing on the server
 * knows about; see `DeclinedRequest` below for what it is for and why *Add* is
 * not an undo.
 *
 * ⚠ **Still no count and no badge**, on either kind. `portal.mjs` asserts the
 * absence of digits on the door and that must go on holding.
 */

/**
 * **A request you have declined, for as long as the box stays open.**
 *
 * ⚠⚠ **NOTHING ON THE SERVER KNOWS THIS EXISTS, AND IT MUST STAY THAT WAY.**
 * `declineTrack` deletes the row and remembers nothing, deliberately: any state
 * a declined request could sit in is a list of people you turned down, which is
 * a worse thing to keep than the row. So this is not read back from anywhere —
 * it is held in the open card, layered over the re-read that answers everything
 * else, and it is gone the moment the portal closes. **A window, not a record.**
 *
 * ⚠ **What it exists for is not history, it is THE HANDLE.** *Decline* is a
 * plain word one tap from *Accept*, with no confirmation, and the request line
 * is the only place `@handle` ever appears for somebody you are not mutual
 * with. A mis-tap used to destroy the only copy of it: the asker is never told,
 * so they do not know to ask again, and the person who declined cannot look
 * them up to put it right. **The open box is the repair.**
 *
 * ⚠ **`Add` is not an undo and does not pretend to be.** Their row is gone, and
 * putting it back would mean writing another person's statement — worse than
 * deleting one, which is why `declineTrack` is the only place in this app one
 * person touches another's row at all. Adding them sends a request the other
 * way, through the same `trackAction` every other Add on this surface calls,
 * and the line then says *Requested* — the word the People row already uses for
 * exactly that state.
 *
 * ⚠ **The strike-through IS the word *declined*, so no new copy is authored.**
 * The sentence stays the one `portalSentence` wrote and wears the record's own
 * mark for *dealt with*; a line saying `@sam — declined.` would have been a
 * second composition of an event that already has an author, and it reads
 * ambiguously besides — *declined* has two subjects in a sentence starting with
 * somebody else's handle. The word is said in full to a screen reader, which
 * cannot see a strike.
 */
export type DeclinedRequest = {
  handle: string
  /** The sentence that asked, struck through rather than replaced. */
  sentence: string
  /** *Add* has been tapped: the request is out and there is nothing left to do. */
  asked: boolean
}

export function Portal({
  lines,
  requests,
  declined,
  answering,
  onAnswer,
  onAdd,
  loading,
  failed,
  onOpen,
  children,
}: {
  lines: PortalLineView[]
  /** Who has added you and is waiting. */
  requests: TrackRequestView[]
  /** Who you have declined since this box was opened. Client-only; see the type. */
  declined: DeclinedRequest[]
  /** The handle in flight, so one tap cannot become two. */
  answering: string | null
  /** `true` adds them back — the same act as the button on their page. */
  onAnswer: (handle: string, yes: boolean) => void
  /** Ask somebody you just declined, which sends a request the other way. */
  onAdd: (handle: string) => void
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

          ⚠⚠ **ONE LINE — directed, 4 September, and it replaced the console's
          `Ask`.** The first version borrowed `Ask` and spent two lines on it: a
          statement, *`@sam` added you.*, then *Add them back?* with Yes and No
          under it. The direction was **one line, `@handle wants to track you.
          Accept / Decline`**, and it is better for a reason worth keeping:
          `Ask`'s shape exists because the console's two questions are about a
          line already on the screen above them, so the question has to name what
          it is asking about. **This sentence already names it.** *Add them back?*
          was a second sentence saying what *Accept* says on its own.

          ⚠ **So Yes/No became Accept/Decline**, which is what makes one line
          legible: bare Yes and No answering a *statement* would be a control
          whose meaning has to be guessed at, on the one surface in this app
          where guessing wrong lets somebody into your record. The verbs answer
          for themselves.

          ⚠ **The sentence is still `portalSentence`'s**, beside the six it must
          not drift from.
        */}
        {/*
          ⚠ **The gap between the two blocks belongs to the SECOND one, and the
          request row carries no bottom margin — measured 4 September.** It wore
          `mb-4`, which is right while something follows it and is dead space
          when nothing does: with a request and no convergence the card measured
          20px of air above the row and 36 below, so the one thing in the box sat
          16px high in it. **A margin that separates two things must belong to
          the thing that may not be there** — so it is the heading's `mt-4`
          below, and the space *between* requests is a `gap` on their own
          container, which no last child can inherit.
        */}
        <div className="flex flex-col gap-4">
        {requests.map((request) => (
          <div
            key={request.handle}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
          >
            {/*
              ⚠ **`min-w-0` and no `truncate`.** A handle can be twenty
              characters and the sentence must never lose its verb; it wraps to a
              second line and the two answers follow it, which is what
              `flex-wrap` is for. The record truncates because a line is one
              line; **this is a question, and a question with its end cut off is
              not answerable.**

              ⚠ **The handle is full ink and the rest is muted — directed.** A
              request is *about a person*, and the person was the one thing on
              the row that read at the same weight as the words around them. Two
              weights of one type rather than a second face or a second colour,
              which is what §11 leaves for a distinction of this size.

              ⚠ **It is a SPLIT of the one authored sentence, not a second
              composition.** `portalSentence` builds it as `@handle` + the rest,
              so slicing at the handle's own length gives the two halves back
              with no string assembled here — a component that wrote *wants to
              track you* itself would be the drift §6 warns about, where the copy
              and the payload say one event two ways.
            */}
            <span className="min-w-0">
              <span className="font-medium">@{request.handle}</span>
              <span className="text-muted">
                {request.sentence.slice(`@${request.handle}`.length)}
              </span>
            </span>

            {/*
              ⚠ **Plain text, not buttons in boxes — and that is what *in-line*
              costs and buys.** A bordered control is a block: it cannot sit in a
              run of words, so the sentence and its answers were two rows at any
              width narrow enough to matter. As words they run on from the
              sentence, which is what was asked for.

              ⚠ **The 44px is untouched.** `tap-target` hangs its hit area off a
              pseudo-element, so a word is exactly as easy to hit as a box was —
              see `shortbox.mjs`. **The affordance is carried by the verbs**:
              *Accept* and *Decline* are not things a sentence says, so they read
              as controls without a border drawn round them.

              ⚠ **Full ink against muted is the whole hierarchy**, the same
              division `Ask` makes with its Yes and No. Accepting is the act;
              declining is the way out of it.
            */}
            {/*
              ⚠ **Right-aligned — directed.** `ms-auto` rather than
              `justify-between` on the parent: the sentence keeps its own width
              and the answers are pushed to the far edge, so a short handle does
              not leave a gap in the middle of a sentence. When the row wraps,
              the answers land on their own line still against the right edge.

              ⚠ **Green and red, and they are the app's first coloured
              controls** — see `--color-accept` in `globals.css` for the scarcity
              terms they arrive on. The words say which is which in full; nothing
              depends on seeing the colour.
            */}
            <span className="ms-auto flex shrink-0 items-baseline gap-4">
              <button
                type="button"
                onClick={() => onAnswer(request.handle, true)}
                disabled={answering !== null}
                className="text-accept tap-target transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onAnswer(request.handle, false)}
                disabled={answering !== null}
                className="text-decline tap-target transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                Decline
              </button>
            </span>
          </div>
        ))}

        {/*
          ⚠ **Below the live questions, because it is not one.** Requests come
          first in this box for one reason — they are the only rows waiting on
          the reader — and a request that has been answered is no longer waiting
          on anybody. It keeps its place in the same container so the answer
          stays where the question was, rather than reflowing to somewhere the
          eye has to find it.

          ⚠ **Smaller and muted, which is what *dealt with* looks like here
          already.** `text-[0.8125rem]` is the size the convergence sentence
          uses on this very surface, so nothing new is picked — and at that size
          the two kinds of row cannot be mistaken for each other even before the
          strike is seen.

          ⚠ **No `opacity-50` on top, unlike the console's struck link.** That
          link is `aria-hidden` decoration on a decision already made; this
          sentence names the person you may be about to add back, so it has to
          stay readable.
        */}
        {declined.map((request) => (
          <div
            key={request.handle}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[0.8125rem]"
          >
            <span
              className={`text-muted min-w-0 ${request.asked ? '' : 'line-through'}`}
            >
              {request.asked ? `@${request.handle}` : request.sentence}
            </span>
            {/*
              ⚠ **The word a strike-through cannot say.** Nothing announces
              `line-through`, so the state is spoken here and drawn there —
              the same division the record's rows make between an `aria-label`
              carrying the whole capture and an ellipsis on screen.
            */}
            <span className="sr-only">{request.asked ? 'Requested.' : 'Declined.'}</span>

            {/*
              ⚠ **`Add` is full ink and deliberately NOT green.** Green is
              *Accept*, and the scarcity rule on `--color-accept` binds from day
              one: the moment it appears on a second affirmative both colours
              stop meaning anything. §11's default is what every other control
              in this app wears.

              ⚠ **It lands where the answers were**, on the same `ms-auto`, so
              the control a thumb is already aimed at does not move under it.
            */}
            {request.asked ? (
              <span className="text-muted ms-auto shrink-0">Requested</span>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(request.handle)}
                disabled={answering !== null}
                className="text-text tap-target ms-auto shrink-0 transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                Add
                <span className="sr-only"> @{request.handle}</span>
              </button>
            )}
          </div>
        ))}
        </div>

        {/*
          ⚠ **The heading belongs to the lines and moves with them.** With
          nothing but requests in the box there is nothing for *Who else* to
          label, and a heading over an empty list is furniture.

          ⚠ **A declined line counts for the gap.** The margin belongs to the
          thing that may not be there, and what may be above the heading is
          *either* kind of row — so a box holding one struck line and a
          convergence needs the air exactly as much as a live request does.
        */}
        {lines.length > 0 && (
          <h2
            className={`stamp text-muted mb-2.5 ${
              requests.length > 0 || declined.length > 0 ? 'mt-4' : ''
            }`}
          >
            Who else
          </h2>
        )}

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
