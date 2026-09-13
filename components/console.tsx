'use client'

import type { EntryState } from '@/lib/domain'
import type { PageLineView } from '@/lib/page-line'
import { AskThem } from './ask-them'
import { CrossOffGlyph, LinkGlyph, RewriteGlyph, SettleGlyph } from './glyphs'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The console — 30 August, Phase 2 step 1
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Tapping a line opens a console: the whole capture, and the things you can do
 * to it.** The record is an index, not a document — every line truncates to one
 * line, so everything past what fits on a row has had nowhere to exist. The row
 * is a spine label; this is the only place a capture is actually shown.
 *
 * ⚠ **It is the thing detail view, and `film-screen.tsx` is deleted into it.**
 * That screen was kept for a surface nothing opened, built for a product whose
 * only kind was a film. Replacing it rather than building beside it is the
 * brief's own instruction and *How things get fixed*'s order: the second surface
 * is removed, not kept in step.
 *
 * ⚠ **It is not navigation.** The bar stays exactly where it was, so somebody
 * looking at a capture is always visibly still on their own page. Same argument
 * the writing sheet won: **a sheet is not a route.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What a tap means now
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **A tap on a line opened a *pick*; it opens this instead.** The pick lit the
 * foot's settle glyph and put `×` and `✎` in the line's own slot — three
 * controls for a line whose text you could not read. All three are here now, on
 * the box that shows the line they act on, which is this project's own rule that
 * **a control belongs where its effect appears** applied one more time.
 *
 * ⚠ **Settle came off the foot, and `foot.tsx` predicted it in writing.** Its
 * docblock said: *if the grouping is revisited, settle is the thing to move —
 * onto the line, where the other two that act on it already are.* It is the last
 * of the three, so the foot drops to `+` and search, which is where the Phase 2
 * brief's §3 has it ending up once the swipes arrive. It arrives one step early
 * because the console — not the swipes — is what took the pick's job.
 *
 * ⚠ **This is not the swipes.** Step 2 of the brief puts cross off and settle on
 * a directional gesture on the row and deletes `picked` outright. Nothing here
 * anticipates that: when it lands, these controls stay as the considered door and
 * the swipe becomes the reflex one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two surfaces, and they are genuinely two
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Directed 30 August, and it is the question the brief left open.** Below
 * `--breakpoint-stack` this is a fixed rectangle over a blurred record; at and
 * above it the console **expands the row in place**, with no scrim and no
 * floating box. A handset has no room to show a capture where it lives; a desk
 * has the width and already stands its tools beside the column rather than under
 * it, so a takeover up there would buy nothing and cost the reader their place.
 *
 * ⚠ **One component and one mount point — the CSS decides.** It renders inside
 * the `<li>` of the line it belongs to, always. `console-sheet` is `fixed` on a
 * handset and `static` on the desk, which is the same trick `Foot`/`ToolStack`
 * and the writing strip already use: **the arrangement is the stylesheet's, so
 * the two placements cannot be given different states.**
 *
 * ⚠ **The contents and their order do not change between them.** Read from the
 * top, act at the bottom: the words first, the controls on the bottom edge,
 * because on a handset that is the only part of the screen a thumb reaches
 * without a regrip. The desk keeps the order rather than inventing a second one
 * for a pointer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  How it closes
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Tap the paper.** That is now the *one* exit gesture in the whole app — the
 * writing strip and the console alike — with `Escape` as the desk's key. On a
 * handset the paper is the scrim; on the desk it is `main` itself, which already
 * carried this gesture when it was letting a picked line go. Nothing here owns a
 * close control and it must not grow one: a second door to the one gesture every
 * surface shares is how a gesture stops being learnable.
 *
 * ⚠ **`✎` closes the console and hands the words to the strip.** **Not** a field
 * in here. *The page has exactly one field and it is the strip* is load-bearing
 * and already works — a second one would have to dodge the keyboard and would
 * put two occupants on one scrim. Reached this way, rewriting **is the rewrite
 * path that already exists**, entered through a different door.
 *
 * ⚠ **It renders instantly, from what the page already holds.** Everything here
 * is on the `Line` the record was already drawing. When *who else* arrives it
 * has to arrive into a space that is already there — never a spinner over the
 * whole box.
 */
export function Console({
  line,
  convergence,
  akin,
  priorDates,
  asking,
  crossedOff,
  onCrossOff,
  onRewrite,
  onLock,
  onSettle,
  onAgain,
  onDone,
  onAcceptOffer,
  onDeclineOffer,
  onOpenPhoto,
  linkLabel,
}: {
  line: PageLineView & { previewUrl?: string }
  /**
   * **Why this line carries a mark**, or `null` — Phase 2 step 4.
   *
   * ⚠ **A written sentence, not the parts of one.** `portalSentence` in
   * `lib/overlap.ts` is its single author — §6 keeps one owner for everything
   * about a match, and a component that assembled *Sam and Ali too.* from a kind
   * and two names would be a second place that knows what a convergence says.
   *
   * ⚠ **`null` is the ordinary case and it draws nothing.** Most lines have not
   * converged; of those that have, the sentence is a read behind the tap and is
   * briefly `null` while it is out. Both render the same — §6: *silence stays
   * silent*, and the interface must never explain an absence.
   */
  /**
   * ⚠ **The sentence AND the people in it — 13 September.** It was a bare
   * string; the control inside the sentence names the same people now, in a
   * different grammar, and deriving a list from English is not a thing to do
   * twice a screen. See `PortalLine.names`.
   */
  convergence: { sentence: string; names: string[] } | null
  /**
   * **The lines of your own that mean nearly this** — the asterisk's grouping,
   * 12 September, directed.
   *
   * ⚠ **The convergence sentence's twin and its opposite in subject.** That one
   * says somebody else wrote this too; this says you did. Both are reads behind
   * the tap, both are `null`-ish while they are out, and both draw nothing at
   * all when there is nothing to say (§6).
   *
   * ⚠ **Lines, not a sentence.** `portalSentence` has one author because a
   * convergence is a claim with names and tenses in it; this is the person's own
   * words handed back, and quoting them is the whole content.
   */
  akin: { id: string; text: string; state: EntryState }[]
  /**
   * **The days this line was written before today's**, newest first, already
   * stamped — 12 September, directed.
   *
   * ⚠ **Strings, not dates.** `lib/day.ts`'s rule: the client never formats a
   * date, because the grouping depends on a timezone and the browser's is not
   * the server's. These arrive through `priorDatesAction` in the record's own
   * stamp voice.
   *
   * ⚠ **Empty is the ordinary case and draws nothing.** A capture written once
   * and never again has no history, so the stamp row is exactly what it was.
   */
  priorDates: string[]
  /** The *Again?* question is standing on this line. */
  asking: boolean
  crossedOff: boolean
  onCrossOff: () => void
  /** `null` while a rewrite is already open — reopening would discard it. */
  onRewrite: (() => void) | null
  /**
   * **Take this one line out of matching, or put it back** — the considered
   * door to the swipe's reflex one, Amendment 10.
   *
   * ⚠ **`null` on the portal's console and nowhere else.** That surface holds
   * `shared: true` by construction rather than by a read, so it has no real
   * answer to change; see the block above the stamp row. The record's console
   * always supplies it.
   *
   * ⚠ **It is the page's own `toggleLock`, not a second handler.** One verb,
   * two doors — a console that wrote its own would be a second opinion about
   * what locking means.
   */
  onLock: (() => void) | null
  onSettle: () => void
  onAgain: () => void
  onDone: () => void
  onAcceptOffer: () => void
  onDeclineOffer: () => void
  onOpenPhoto: () => void
  linkLabel: (href: string) => string
}) {
  const photo = line.previewUrl ?? (line.id === '' ? null : `/api/media/${line.id}`)

  return (
    <div
      /*
        ⚠ **`z-10`: over the scrim, under the two bars** — the band's old rule,
        and for the band's old reason. The bar stays visible because the console
        is not navigation, and the writing strip stays reachable at `z-20`
        because the `+` is how somebody leaves this for a new capture. Inert on
        the desk, where this is in flow and nothing is stacked.

        ⚠ **`--console-from` is written on the page's host by `openConsole`, and
        is neither a prop nor state.** It is the tapped row's own `top` at the
        moment of the tap, and it is the *rise's origin only* — the box it lands
        in is a constant either way. It is not state because it feeds nothing but
        a keyframe: a number in state would re-render the record to change one
        custom property. It is not an inline `style` because **the production CSP
        blocks style attributes** (§10) — `useKeyboardHem` writes
        `--keyboard-overlap` onto the same host for the same reason, and CSSOM is
        not what a `style-src` policy blocks.
      */
      className="console-sheet z-10"
    >
      <div className="console-card">
        {/*
          ⚠ **The scrolling half, and the controls are deliberately outside it.**
          The box is fixed, so a long capture has to go somewhere; the bottom
          edge is where a thumb is and must not scroll away from it. `min-h-0` is
          what lets this shrink inside the flex column — without it the controls
          are pushed off the box the whole design rests on being fixed.

          ⚠ **It does not scroll on the desk**, because in flow there is no
          height to be inside of: the row grows to hold the capture and the page
          scrolls, which is what *expands in place* means.
        */}
        {/*
          ⚠ **`touch-action: pan-y` takes back what `console-sheet` refused, and
          `overscroll-behavior: contain` stops it chaining.** The sheet sets
          `touch-action: none` so nothing pans the record behind a box fixed to
          the glass; a capture longer than the bounds still has to be readable,
          so the one box that legitimately scrolls says so — and says that
          reaching its end is the end, not the page's turn. See the note on
          `console-sheet`.
        */}
        <div className="stack:overflow-visible min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-[var(--page-lead)]">
          {/*
            ⚠ **The capture is the FIRST thing in the box, and that is what makes
            the alignment possible — 30 August.** The day stamp was here and is
            below the words now. Directed: the console's text should land on the
            record's first line, and `--console-top` derives exactly that — but
            only if what sits at the card's padding edge is the words themselves.
            Anything above them pushes the alignment out by its own height.

            **It also stopped the record's stamp being said twice.** With the
            console open on the newest line, its stamp sat directly over the
            record's own — the same word, in the same mono, one behind the glass
            and one in front of it. Moving it under the capture removes the
            duplication and gives the alignment its edge, which is one change
            answering two things.

            ⚠ **The whole capture, wrapping, at the record's own type.** This is
            the one place on the page where the one-line rule does not apply —
            not an exception to it, but the reason for it: the row truncates
            *because* there is somewhere the rest of it lives. Same size, leading
            and tracking as `page-row`, so these are the same words in the same
            place, larger only by the desk's root scale.

            ⚠ **A struck line is struck here too**, with the identical pair of
            classes the row uses rather than two rules that agree.
          */}
          {/*
            ─────────────────────────────────────────────────────────────────
             The lock's control rides the words — 12 September, directed
            ─────────────────────────────────────────────────────────────────

            Asked: *how do we reorganise the console's contents so it's easily
            understandable and not too jampacked? Maybe move `lock` so it's
            optically in-line with the entry?*

            ⚠⚠ **IT WAS IN THE STAMP ROW AND THAT ROW'S OWN JUSTIFICATION HAD
            EXPIRED.** 11 September put it there in these words: *the stamp row,
            not a line of its own — it already says what is known about this
            capture **and had room at its end**.* The prior dates took that room
            the same week. **Screenshotted at 390: the row wrapped, `Unlock`
            was stranded mid-line, and `1983 LOCKED` fell to a second line
            where the year read as one more date.** The premise changed; the
            placement follows it.

            ⚠⚠ **AND THE REAL FAULT IS THAT A CONTROL WAS IN A ROW OF FACTS.**
            The stamp answers *what is known about this capture* — today, the
            year it resolved to, that it is locked. **A verb is not one of
            those.** Up here it sits on the object it acts on, which is this
            repository's own rule twice over: *a control belongs where its
            effect appears*, and design rule 5's *a tap on a row acts on that
            row*.

            ⚠ **The state stays below and the verb comes up, which is 11
            September's rule rather than a break with it:** *the state is marked
            only as the exception and the verb is always a verb.* `LOCKED` is a
            fact and stays with the facts; `Lock` / `Unlock` is a control and
            goes with the thing. **They are two things, said in two places,
            which is what that rule asks for.**

            ⚠⚠ **THE WORDS ARE STILL THE FIRST THING IN THE BOX.** The alignment
            to the record's first line depends on it — *anything above them
            pushes it out by its own height* — so this is a flex row **around**
            the same `<p>`, not a row above it. The words are `flex-1` and the
            control `shrink-0`, so the text's left edge and first baseline are
            exactly where they were. `items-baseline` puts the control on the
            first line of a capture that wraps to three.

            ⚠ **`min-w-0` on the words**, or a long unbroken string would refuse
            to shrink and push the control off the card.

            ⚠⚠ **THE SAME FIVE-COLUMN GRID AS THE GLYPH ROW, AND THAT IS HOW THE
            ALIGNMENT IS GUARANTEED RATHER THAN MEASURED — 12 September,
            directed:** *the lock/unlock button should be vertically optically
            in-line with the tray glyph.* The settle glyph sits at
            `col-start-5 justify-self-center` of a row bled to the card's edges;
            **this row is that row's geometry, so the two centres are the same
            number by construction.** A `text-end` or a hand-tuned inset would be
            a constant waiting to be wrong the day the foot's columns change
            again — which they did on 5 September, when a home glyph moved the
            tray from column four to five.

            ⚠ **`-mx-[var(--page-lead)]` and `ps-[var(--page-lead)]` are the
            glyph row's own pair**: the grid bleeds out to the card's edges and
            the first cell pushes back in, so **the words end up exactly where
            they were** and the alignment to the record's first line is
            untouched.

            ⚠ **The sight line is `traysightline.mjs`'s**, and this control now
            stands on it too — see that probe's warning: *if a later change makes
            the settle glyph sit anywhere but the foot's fifth column, the
            reaction it exists for is dead before it is written.* There are two
            things on that line now, not one.
          */}
          <div className="-mx-[var(--page-lead)] grid grid-cols-5 items-baseline">
            <p
              className={`col-span-4 min-w-0 ps-[var(--page-lead)] text-[length:var(--text-line)]/[var(--leading-line)] tracking-[-0.01em] ${
                crossedOff ? 'line-through opacity-50' : ''
              }`}
            >
              {line.text}
            </p>

            {onLock !== null && (
              <button
                type="button"
                onClick={onLock}
                /*
                  ⚠ **The consequence, not the mechanism.** A screen reader gets
                  the whole of what the tap does, because the visible word is one
                  syllable and the thing it changes is the app's central privacy
                  boundary. ⚠ **It is unchanged by the capitals and the colour**:
                  neither reaches a reader who cannot see them, so the label is
                  what has to carry the state to them — which it already did.
                */
                aria-label={
                  line.shared
                    ? 'Lock this capture, so nobody is told you wrote it'
                    : 'Unlock this capture, so you can both be told'
                }
                /*
                  ─────────────────────────────────────────────────────────────
                   LOCKED IS SAID BY THE CONTROL — 12 September, directed
                  ─────────────────────────────────────────────────────────────

                  *The `UNLOCK` word that appears next to `today/[date]` is
                  superfluous. `Lock` becomes `Unlock` so it's obvious if an
                  entry is locked or not — just make `UNLOCK` all capitals, and
                  a suitable green colour.*

                  ⚠⚠ **THIS OVERRIDES 11 SEPTEMBER'S RULE AND DESIGN RULE 1, AND
                  IT IS DIRECTED WITH THAT STATED.** Both say the same thing:
                  *the state is marked only as the exception and the verb is
                  always a verb* — say the state and say the verb, as two
                  things. The `LOCKED` stamp in the row below was the state half
                  and it is deleted. **What replaces it is not nothing**: the
                  control changes its word, its case AND its colour, so the
                  state is on screen three times over in the one place a reader
                  is already looking. Design rule 1 asks whether a reader
                  understands what this means or does; it does not require two
                  elements to do it.

                  ⚠⚠ **BOTH FACES CARRY COLOUR SINCE 12 September, directed:**
                  *put `lock` in an appropriate red.* **That reverses the rule
                  this block stated the same day** — *only the locked face is
                  loud; `Lock` on an ordinary line stays sentence-case chrome,
                  the app's grammar of marking the exception and leaving the rule
                  quiet. An ordinary capture gains nothing.*

                  ⚠ **What survives is the distinction, moved off colour and
                  onto CASE.** `Lock` is sentence case and `UNLOCK` is
                  capitals, so the locked line is still the loud one and the
                  exception is still marked. **Colour now says which way the
                  tap goes** — red withdraws the line from the pool, green puts
                  it back — which is a second reading of the two words, not a
                  replacement for them.

                  ⚠⚠ **`--color-decline`, WIDENED, AND A SECOND RED IS REFUSED
                  ON THE GREEN'S OWN ARGUMENT.** That token's note reads: *the
                  moment green appears on a second affirmative both stop meaning
                  anything*, and it answered that by widening rather than
                  copying — green became *the affirmative act on offer*. **Red
                  takes the symmetric widening: the withdrawing act on offer**,
                  which is decline a request and lock a line out of the pool.
                  Two reds meaning two things is what this palette exists to
                  avoid, and a new one would need its own contrast measurement
                  to say what this one already says.

                  ⚠ **Cost, stated: `--color-chrome` no longer reaches this
                  control at all**, so the console's one brass word is gone and
                  colour here is entirely a statement about consequence. ⚠ **A
                  third tenant is refused on both tokens.**

                  ⚠ **Capitals in the INTERFACE face, not `stamp`.** That
                  utility is mono, tracked 0.22em and is the voice of the facts
                  below; this is a control, and 11 September's distinction
                  between the two survives the capitals. ⚠ **0.08em of tracking**
                  because caps at 11px set solid are a wall — it is the wordmark's
                  own figure, not a new one.
                */
                className={`tap-target col-start-5 justify-self-center text-[length:var(--text-micro)] ${
                  line.shared ? 'text-decline' : 'text-accept uppercase tracking-[0.08em]'
                }`}
              >
                {line.shared ? 'Lock' : 'Unlock'}
              </button>
            )}
          </div>

          {/*
            ─────────────────────────────────────────────────────────────────
             Who else — Phase 2 step 4, 31 August
            ─────────────────────────────────────────────────────────────────

            **The sentence behind the mark**, and this is the empty slot the
            console was built leaving. Its own docblock predicted it in writing:
            *when who else arrives it has to arrive into a space that is already
            there — never a spinner over the whole box.* It does.

            ⚠ **Directly under the words, above everything else in the box.** The
            mark in the gutter says *this line is special* and cannot say why;
            this is the why, so it belongs against the thing it is about rather
            than below a photograph that may be 40vh tall. The stamp underneath
            answers *what is known about this capture*; this answers *what
            happened to it*, which is a different question and a later one.

            ⚠ **Muted, at the link's size, not in `--color-accent`.** The colour
            is the mark's and the mark is in the gutter — §11 gives the accent to
            overlap *state*, and a paragraph of coloured text in the one box that
            shows a capture whole would make the sentence louder than the
            capture. **If the tie between the mark and this sentence ever reads
            weakly, the accent is the thing the rule allows** — but it should be
            tried on the words *of the sentence* and never on the capture.

            ⚠ **No label, no heading and no empty state.** A line that converged
            with nobody draws nothing at all, and so does one whose read is still
            out. §6: *silence stays silent* — the interface must never explain an
            absence, and a *no matches yet* here would be the most natural thing
            in the world to add and the exact thing that is forbidden.
          */}
          {/*
            ⚠ **The way out rides the sentence here too — Amendment 10**, and
            the condition is the sentence's own. The portal is arrival and this
            is memory: a convergence on a line from March is as actionable as one
            that landed this morning, and the mark in the gutter is what sent the
            reader here. **One control, both surfaces**, for the same reason
            `portalSentence` is one author — see `components/ask-them.tsx` for
            why it is a word in the run rather than a fourth glyph in the row
            below.

            ⚠⚠ **A CROSSED-OFF LINE NO LONGER HAS IT — 12 September, directed,
            AND THIS BLOCK SAID THE OPPOSITE.** It read: *a crossed-off line
            keeps it; the mark survives crossing off because a resolution is not
            an erasure, and somebody who struck a line can still want to say we
            both saved this.* The mark goes when a line is struck now, and
            `askWhoElse` is gated on the mark — so `convergence` is `null` on a
            struck line and `AskThem` goes with it. **Put the line back and both
            return**; nothing was destroyed. See `converged` in
            `lib/db/captures.ts`.
          */}
          {convergence !== null && (
            <p className="text-muted mt-3 text-[0.8125rem]">
              {convergence.sentence}
              <AskThem text={line.text} names={convergence.names} />
            </p>
          )}

          {/*
            ─────────────────────────────────────────────────────────────────
             The asterisk's grouping — 12 September, directed
            ─────────────────────────────────────────────────────────────────

            *When the user taps the semantically similar entries, they see a
            grouping of them in the console.*

            ⚠⚠ **IT HAS A LEAD-IN WHERE THE CONVERGENCE SENTENCE NEEDS NONE, AND
            THAT IS DESIGN RULE 1 BEATING DESIGN RULE 2.** *Sam too.* explains
            itself because it names somebody; a bare list of your own lines under
            your own capture does not — it could as easily read as *these
            converged* or *these are in the same collection*. Density rule 2 bans
            **a heading over a list that reads as a list**, and this list does
            not read as itself. **Three words, and they are the whole frame.**

            ⚠ **The same register as the refusal at the door.** `writeCapture`
            answers an exact duplicate with *Already on your record.*; this is
            the near-duplicate's version of the same fact, so the two surfaces
            say one thing in one voice.

            ⚠ **The words are quoted, never run into a sentence frame.**
            `ask-them.tsx` settled this: *you also wrote learn to sail and see
            the sea* breaks on arbitrary text, and quoting is what makes it total
            over anything somebody typed.

            ⚠ **Not buttons, and that is a decision rather than an omission.**
            Tapping one could open that line's console — but this card is
            `position: fixed` on a handset and swapping its subject underneath a
            reader is a second way to open a console, against design rule 5's
            *one gesture means one thing*. **The record is one dismissal away**
            and the line is on it. If this proves to be the thing people reach
            for, the fix is that these navigate — not that they mutate the open
            card.

            ⚠ **Muted, at the convergence sentence's size**, for its reason: the
            accent belongs to overlap state in the gutter, and this is neither a
            control nor a convergence. **No count** — §5 refuses the portal one
            and *3 like this* is that number with a different noun.

            ⚠ **Struck lines are already gone from it**, filtered in `getAkin`
            rather than here: a line with a rule through it is one you have
            answered, which is the same rule the mark and the portal now follow.
          */}
          {akin.length > 0 && (
            <div className="text-muted mt-3 text-[0.8125rem]">
              You also wrote
              <ul>
                {akin.map((a) => (
                  <li key={a.id}>“{a.text}”</li>
                ))}
              </ul>
            </div>
          )}

          {/*
            **The photograph, at a size worth looking at.** On the row it rides
            the line in the year's slot, which is a mark saying *there is one*;
            in here it is the thing itself. Tapping it still opens it full size —
            the console is where a capture is shown, not where a picture is
            examined.

            ⚠ **The preview wins over the stored one while it exists**, for the
            row's own reason: there is no id to ask `/api/media` for until the
            upload returns, and an empty slot in the meantime is the app looking
            like it lost the photograph.
          */}
          {line.hasImage && photo && (
            <button
              type="button"
              onClick={onOpenPhoto}
              aria-label="Open the photograph"
              className="mt-3 block w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a private route, not a CDN; see app/api/media */}
              <img
                src={photo}
                alt=""
                className="max-h-[40vh] w-full rounded-[3px] object-cover"
              />
            </button>
          )}

          {/*
            ⚠ **A real `<a>`, and the host rather than a title.** Both rules come
            straight off the row and neither is weakened by there being room:
            `noreferrer` because the destination is somewhere a person saved
            privately, and the host because **a URL is user input shaped like
            chrome** — rendering a fetched page title would be a capture claiming
            something nobody checked. §7's evidence rules come first.

            ⚠ **Struck with the line, and then it is a `<span>`.** There is no
            disabled state for an anchor — an `<a>` without an `href` is not a
            control at all — and a door out of a decision somebody has already
            made is not a door this page offers.
          */}
          {line.sourceUrl !== null &&
            (crossedOff ? (
              <span
                aria-hidden
                className="text-muted mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] line-through opacity-50 [--glyph:var(--glyph-line)]"
              >
                <LinkGlyph />
                {linkLabel(line.sourceUrl)}
              </span>
            ) : (
              <a
                href={line.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-chrome mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] transition-colors [--glyph:var(--glyph-line)]"
              >
                <LinkGlyph />
                {linkLabel(line.sourceUrl)}
              </a>
            ))}

          {/*
            **When it was written, and what it resolved to** — in the record's
            own stamp, which is the same mono that sits above every group of
            lines. The console is one line of that record opened, so it says
            *when* in the record's voice rather than inventing a second one.

            ⚠ **Below the capture since 30 August, where it was above it.** Two
            reasons and either is enough. The words have to be the first thing in
            the box or the alignment to the record's first line is off by
            whatever sits over them; and with the console open on the newest line
            this stamp sat directly on top of the record's own, saying *Today*
            twice, once behind the glass and once in front of it.

            ⚠ **The year is the resolution, and here it can stand on its own.**
            On the row it is one number squeezed beside a clipping box; there is
            room in here, and *this line found its possibility* is exactly what a
            reader of the record cannot otherwise see. It rides the day because
            both answer *what is known about this capture* rather than *what it
            says*.
          */}
          {/*
            ─────────────────────────────────────────────────────────────────
             The lock, where a reader is actually looking — 11 September
            ─────────────────────────────────────────────────────────────────

            ⚠⚠ **THIS CLOSES A DEBT RECORDED ON 4 SEPTEMBER IN THE WORDS IT WAS
            RECORDED IN.** The lock's teaching sentence was deleted that day and
            the entry said: *what it costs — nothing now teaches the lock swipe…
            if the lock proves undiscoverable, this is what was removed, and it
            should come back **where a reader is actually looking.*** Amendment
            10 made it binding: a hidden gesture cannot carry the one disclosure
            that a private capture may become a social event.

            ⚠⚠ **THE SWIPE IS UNTOUCHED AND THIS IS NOT A SECOND MECHANISM.**
            Both doors call the page's one `toggleLock`. This console's own
            docblock predicted the arrangement before the swipes existed: *these
            controls stay as the considered door and the swipe becomes the reflex
            one.* Amendment 10 asks for the control *as well as* the gesture, in
            those words.

            ⚠ **The stamp row, not a line of its own.** It already says *what is
            known about this capture* and it already has room at its end — so an
            ordinary capture gains **no copy at all**, which is the trade a line
            of explanation on every console would have lost. Density rule 2:
            reuse a row before adding a block.

            ⚠⚠ **THE STATE IS MARKED ONLY AS THE EXCEPTION, AND THE VERB IS
            ALWAYS A VERB.** `LOCKED` is a stamp in the row's own mono; `Lock` /
            `Unlock` is a control in the interface face. That is design rule 1 —
            *say the state and say the verb, as two things* — and it is the
            record's existing grammar: a live line says nothing where a
            crossed-off one is struck, and the × beside it still reads *Put it
            back*.

            ⚠ **No padlock on a button.** `docs`/CLAUDE.md settled this when the
            mark was chosen: *a padlock is right as a STATE and would have been
            wrong as a control label — on a button it says security, and this is
            scope.* The padlock stays what it is, a mark in the row's tail.

            ⚠⚠ **`onLock` IS `null` IN THE PORTAL, AND THAT IS NOT TIDINESS.**
            `listMyPortal` sets `shared: true` **by construction** — a locked
            capture cannot have produced the notification that put the row there,
            so the read deliberately does not ask the database to confirm a row
            it just returned. A control that changed that bit would make the
            assumption false the moment somebody used it, and the portal's copy
            of the line would then be lying. The record is the surface that holds
            the real answer, and it is one tap away.
          */}
          {/*
            ─────────────────────────────────────────────────────────────────
             The facts, and then the history — 12 September, directed
            ─────────────────────────────────────────────────────────────────

            ⚠⚠ **THE CONTROL HAS GONE UP TO THE WORDS AND THIS ROW IS FACTS
            ALONE.** It used to end with `Lock` — 11 September's *reuse a row
            before adding a block*, taken when the row had room at its end. The
            prior dates took that room the same week and a screenshot showed
            what was left: **the row wrapped, the control was stranded mid-line,
            and `1983 LOCKED` fell below where the year read as one more
            date.** The note this replaces argued only about *where* the control
            sat in the run — *it is not pushed to the far edge;
            `justify-between` was tried and is wrong on the desk, where the
            word ended ~800px from its stamp.* **That argument is still true and
            it is why the control did not simply move right.**

            ⚠ **What is left is one register: when, what it resolved to, and
            whether it is locked.** Today, a year, `LOCKED`. Nothing here is a
            verb.
          */}
          {/*
            ⚠⚠ **`LOCKED` STOOD HERE AND IS DELETED — 12 September, directed:**
            *the `UNLOCK` word that appears next to `today/[date]` is
            superfluous.* It was 11 September's state half, beside the control's
            verb. **The control now says the state three ways** — its word, its
            case and its colour — so the stamp was the fourth telling, in the row
            whose whole job is the facts the control cannot show.

            ⚠ **What is left is one register: when, and what it resolved to.**
          */}
          <p className="stamp text-muted mt-3">
            {line.dayLabel}
            {line.year !== null && <span className="ms-2">{line.year}</span>}
          </p>

          {/*
            ─────────────────────────────────────────────────────────────────
             And the days it was written before — 12 September, directed
            ─────────────────────────────────────────────────────────────────

            *The previous date of entry/entries preserved and presented in the
            console… should read in numbers and should have wording that
            provides context for the date… in a smaller font than `today` or
            the date to their left.*

            ⚠⚠ **ITS OWN LINE, WHICH REVERSES WHAT THIS BLOCK SAID THIS
            MORNING.** It read: *in the stamp row, because it is the same fact —
            density rule 2, reuse a row before adding a block.* **Reuse a row
            that has room**, and the screenshot is what settled it: with a year,
            a `LOCKED` and two dates the row wrapped and the facts interleaved
            with the history. Density rule 2's own precondition failed, which is
            the one thing that licenses a second line.

            ⚠⚠ **QUIETER, NOT SMALLER, AND THAT IS THE TYPE SCALE'S ANSWER
            RATHER THAN A REFUSAL OF THE DIRECTION.** `--text-micro` is
            **0.6875rem — 11px — and it is the floor**: its own note calls it
            *the caption tier*, and there is nothing below it in
            `globals.css`. A tracked, uppercased mono under 11px stops being
            readable, and inventing a step below the scale for one line is the
            fourth breakpoint problem in a type face. **What makes the stamp
            loud is its 0.22em tracking, not its size** — so this drops the
            tracking and keeps the size, and reads markedly quieter beside the
            row above it. ⚠ **If it must genuinely be smaller, that is a new
            token and a decision about the scale's floor, not a class here.**

            ⚠ **`Prev`, directed**, and it is the abbreviation the row's own
            grammar was already speaking: `TODAY`, `1983`, `LOCKED` are
            all telegraphic. ⚠ **One word for the whole run** — design rule 4,
            the matching rule's precedent: two dates do not want two labels.

            ⚠ **In numbers, and the filtering is NOT here.**
            `priorDatesAction` reduces the instants to distinct days, drops the
            day the row above is already showing, and prints them through
            `lib/day.ts`'s `numeric`. **The client never decides what day
            something happened on** — its timezone is not the server's, which is
            that file's founding rule.

            ⚠ **Nothing at all when a line has never moved**, which is every
            ordinary capture: no label, no empty line, no space reserved. §6 —
            silence stays silent.
          */}
          {priorDates.length > 0 && (
            <p className="text-muted mt-1 font-mono text-[length:var(--text-micro)] uppercase">
              Prev {priorDates.join(', ')}
            </p>
          )}

          {/*
            ⚠ **The standing question, in full, because there is room.** On the
            row it is a bare `?` in the year's slot — one character, no glyph, no
            new vocabulary. In here the question can actually be asked, which is
            what the `?` has been pointing at all along.

            ⚠ **It reuses the record's own pair rather than inventing an accept
            control**, and it reuses it *by being the same component*, so the two
            kinds of question this app asks cannot drift into looking like
            different kinds. They are not: both are one line of the record asking
            the person who wrote it to decide something, and both are answerable
            by ignoring them.
          */}
          {line.offer !== null && (
            <Ask
              ask={
                line.offer.year !== null
                  ? `${line.offer.title} (${line.offer.year})?`
                  : `${line.offer.title}?`
              }
              onYes={onAcceptOffer}
              onNo={onDeclineOffer}
            />
          )}

          {/*
            ⚠ **One question, and the word is *Again?*** The two outcomes are
            genuinely different claims — *I would do this again* against *that is
            dealt with* — and nothing about a raw capture can supply the answer.
            It is also the app's own name.
          */}
          {asking && <Ask ask="Again?" onYes={onAgain} onNo={onDone} />}

          {/*
            ─────────────────────────────────────────────────────────────────
             ⚠ WHO ELSE GOES HERE, AND THE SPACE IS DELIBERATELY EMPTY
            ─────────────────────────────────────────────────────────────────

            Phase 2's convergence sentence — *Sam too.* / *Sam has.* / *Sam wants
            to.* / *Sam has too.* — lands in this slot, and so, much later, does
            the conversation the brief holds back behind Phase 6's blocking,
            reporting and moderation requirements. **Build the space and leave it
            empty** is the brief's instruction, and this comment is it.

            ⚠ **Nothing renders here until there is something.** *Silence stays
            silent*: no *no matches yet*, no empty state for convergence on a
            line. **Nothing is the correct rendering of nothing** — and an
            absence explained is an absence the copied-provenance suppression
            rule worked hard to keep quiet.

            ⚠ **When it arrives it must arrive into a space that is already
            there**, and never as a spinner over the whole box. Everything above
            this line is on the page already; only this needs the network.
          */}
        </div>

        {/*
          ⚠ **The controls, on the bottom edge, and that is the design rather
          than a layout.** *Read from the top, act at the bottom* — on a handset
          the bottom of the box is the only part a thumb reaches without a
          regrip, and because the box never moves, neither do they.

          ⚠ **A crossed-off line offers one control and it is the way back.**
          Cross off is a resolution, not a delete — the row stays where it is,
          struck through — and while it is struck the other two would be acting
          on something somebody has said they are done with. The rewrite *goes*
          rather than going dark, which is the record's own rule for this pair: a
          dark pencil beside a struck line is the page explaining what it is
          refusing, and nothing there is the page showing one way back.
        */}
        {/*
          ⚠⚠ **THE ROW IS THE FOOT'S OWN FOUR-COLUMN GRID — 2 September,
          directed: the tray in the console should line up exactly with the tray
          in the bottom row.** It did not: `justify-between` put the settle
          glyph against the card's text edge, centred at 337, while the foot's
          tray sits centred in its fourth column at **326.25** — 10.75px apart,
          and both on screen together whenever the strip is down.

          ⚠ **The two boxes coincide by construction, which is the only reason
          this can be an alignment rather than an offset.** The card is
          `--record-measure` wide with `margin-inline: auto` inside a sheet
          wearing the gutter; the strip is `--record-measure` with the same
          gutter and the same `mx-auto`. **Same width, same origin, at every
          width** — so four equal columns over the card's border box are the
          foot's four columns.

          ⚠ **`-mx-[var(--page-lead)]` cancels the card's padding**, because the
          grid has to span the card's border box and the padding is what makes
          the content box narrower than the strip. The left group takes the
          padding back as `ps-` so its ink still starts on the card's text edge
          — the record's own column — where the capture's words start.

          ⚠ **The foot is four columns whenever a console can be open.** It drops
          to three only when `write` is null, and `write` is null only on an
          empty record — which has no line to tap. The alignment cannot be caught
          out by the three-column case.

          ⚠⚠ **IT IS A SIGHT LINE FOR AN INTERACTION THAT IS NOT BUILT, AND THAT
          IS WHY IT MUST NOT BE TIDIED AWAY.** Stated when it was asked for:
          **settling from this console is meant to make the foot's tray react** —
          the line going somewhere you can watch it go. What the reaction is has
          not been decided and nothing here implements one. **The alignment is
          the half that has to be true first**: a thing cannot appear to travel
          to a target it is not pointing at, and the two glyphs are on screen
          together whenever the strip is down.

          **So this row is not `justify-between` with the spacing improved.** If
          a later change makes the settle glyph sit anywhere but the foot's
          fourth column, the reaction it exists for is dead before it is written.
          `node_modules/.probe/trayalign.mjs` measures both in one run — 326.25
          against 326.25 at 390.
        */}
        {/*
          ⚠⚠ **FIVE COLUMNS SINCE 5 SEPTEMBER, BECAUSE THE FOOT HAS FIVE.** This
          row is the foot's grid for one reason: the settle glyph sits on the
          tray's x centre as a sight line for a reaction that is not built. The
          foot took a home glyph on its far left that day, so the tray moved from
          column four to column five — and `foot.tsx` says in writing that
          moving it *breaks something that is not written yet, so move the
          console's with it.* **This is that move.** Both centres are asserted
          equal by `node_modules/.probe/traysightline.mjs`.
        */}
        <div className="mt-4 grid grid-cols-5 items-center [--glyph:var(--glyph-foot)]">
          <div className="col-span-4 flex items-center gap-5 ps-[var(--page-lead)]">
            <button
              type="button"
              onClick={onCrossOff}
              aria-label={crossedOff ? 'Put it back' : 'Cross it off'}
              className="text-chrome tap-target flex items-center"
            >
              <CrossOffGlyph />
            </button>

            {!crossedOff && (
              <button
                type="button"
                disabled={!onRewrite}
                onClick={() => onRewrite?.()}
                aria-label="Rewrite it"
                className={`tap-target flex items-center ${
                  onRewrite ? 'text-chrome' : 'text-muted opacity-40'
                }`}
              >
                <RewriteGlyph />
              </button>
            )}
          </div>

          {/*
            ⚠ **Settle sits apart from the other two, because it does something
            else.** Cross off and rewrite keep the line on the page; this sends it
            off the page, to the tray. The gap between them is that difference.

            ⚠ **A crossed-off line cannot be settled**, and that is the server's
            rule showing through rather than a second opinion: `resolveCapture`
            guards on `want`, so the settleable set is exactly the resolvable one,
            and the way back is the × that put it there.
          */}
          {!crossedOff && (
            <button
              type="button"
              onClick={onSettle}
              aria-label="Settle it"
              aria-expanded={asking}
              className="text-chrome tap-target col-start-5 flex items-center justify-self-center"
            >
              <SettleGlyph />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * **One question, two answers**, and the console asks exactly the two the record
 * asks: *Again?* when a line is being settled, and *is this what you meant?*
 * when a possibility is offered.
 *
 * ⚠ **It is the record's `Question` moved in here rather than copied.** Both
 * kinds are one line of the record asking the person who wrote it to decide
 * something, and both are answerable by ignoring them; two components would be
 * two designs waiting to disagree about that.
 *
 * ⚠ **The record still renders one of them** — the offer, at the moment of
 * capture, so a question arrives visibly rather than as a mark somebody has to
 * notice. That is why this is exported.
 *
 * `gap-5` on a coarse pointer because Yes and No both carry a 44px hit area and
 * at `gap-4` the two expansions meet in the middle.
 */
export function Ask({
  ask,
  onYes,
  onNo,
}: {
  ask: string
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 pointer-coarse:gap-5">
      <span className="text-sm">{ask}</span>
      <button
        type="button"
        onClick={onYes}
        className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onNo}
        className="text-muted hover:text-text tap-target text-sm transition-colors"
      >
        No
      </button>
    </div>
  )
}
