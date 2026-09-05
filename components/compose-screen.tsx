'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Bar, OFF } from './bar'
import { Foot } from './foot'
import { AttachGlyph, SendGlyph } from './glyphs'
import { useKeyboardHem } from './keyboard-hem'
import { captureAction } from '@/app/actions/captures'
import type { PortalWaiting } from '@/lib/db'

/**
 * **The front page: the corpus above, a composer below.** Amendment 5, 5
 * September.
 *
 * ⚠⚠ **THE RECORD USED TO BE HERE AND IT IS AT `/record` NOW.** `/` was the
 * record itself from 23 August to 5 September — a blank page you typed down.
 * The direction: *the front page is a place where people can both lodge a
 * thought as quickly as possible and browse by swiping images of experiences
 * and productions.* See `docs/re-direction/the-front-page.md`.
 *
 * ⚠⚠ **THE APP IS STILL RECORD-FIRST, AND THAT IS THE TIEBREAK FOR EVERYTHING
 * ON THIS SCREEN.** *We exist so people can make a record of the things that
 * interest them.* So this page is a **feeder**: everything on it ends in a
 * capture, and the record is one tap away in the foot and never more.
 *
 * ⚠ **The browse half is NOT BUILT and its space is deliberately empty.** Step
 * 3 of the brief's sequence fills it from the corpus. It is left as a hole
 * rather than filled with a placeholder, because §6's *silence stays silent*
 * forbids explaining an absence and a temporary occupant is work to delete.
 *
 * ⚠ **This is not `PageScreen` with the record removed.** It shares the
 * mutation (`captureAction`) and the strip's positioning (`writing-sheet`), and
 * nothing else. The record's strip is a **one-line field bound to an existing
 * capture** — rewriting is all it has left to do; this is a **wrapping composer
 * for new ones**. Two single-purpose objects where there was one that did both.
 */
export function ComposeScreen({
  portalWaiting,
  searchable,
  imagesOn,
}: {
  /** Phase 2 step 3: is there anything to say. One bit — never a count. */
  portalWaiting: PortalWaiting
  /** Whether there is a record to search. */
  searchable: boolean
  /**
   * Whether the app has anywhere to put a photograph.
   *
   * ⚠ **A server fact, because the token is one.** Attach is dark when there is
   * nowhere to put a photograph — *a control that cannot act goes off*, which is
   * the foot's own rule — and it is what makes deploying with no Blob store safe
   * rather than broken. See `imagesAvailable`.
   */
  imagesOn: boolean
}) {
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [writing, setWriting] = useState(false)
  /**
   * ⚠⚠ **THE CONFIRMATION IS THE ROW, AND THIS IS THE ROW.** Decided in the
   * build rather than in the brief, on this repository's own precedent: the
   * handshake's handle field *navigated* instead of confirming and **read as
   * done when nothing had been sent** — production held 0 tracks. The answer
   * there was *the confirmation is the row, not a message.*
   *
   * The record is not on this screen any more, so the row it lands in is not
   * either. **One line stays here until the next one replaces it**, which is
   * not the list — the list is at `/record` — it is the receipt.
   *
   * ⚠ **It is not a toast and must not become one.** It does not time out, it
   * carries no tick and it says nothing; it is the words, where they were
   * typed. A timed message would be an absence again a second later.
   */
  const [landed, setLanded] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  /**
   * **Does what is in the field fit the two lines it has?**
   *
   * ⚠⚠ **A CAPTURE IS AS LONG AS THE BOX — directed 5 September, and it is a
   * SUBTRACTION.** The words used to roll up out of sight and a drawn mark said
   * so; the ask was that the composer never need scrolling at all, and the way
   * to get that is not a better readout, it is for the overflow to be
   * unreachable. **The roll-under, the roll mark and `readRoll` are deleted**
   * — see the tombstones in `globals.css`.
   *
   * ⚠⚠ **MEASURED, NEVER A CHARACTER COUNT.** *"The number of characters that
   * fit"* is not a number: it is different on the desk (four-thirds the type),
   * different in Arabic, different for `mmmm` than for `iiii`. A `maxLength`
   * would be a constant tuned until one handset looked right, which is the one
   * thing this repository rules out by name. **The element is asked instead**,
   * which is `readRoll`'s own rule kept after `readRoll` went.
   *
   * ⚠ **Synchronous, and that was checked rather than assumed.** `readRoll` ran
   * in a `requestAnimationFrame` because `scrollHeight` is not right until the
   * new text is laid out — but a cap has to refuse a keystroke *during* it, a
   * frame later being a character that appears and then vanishes. Measured in
   * Chromium and WebKit at the boundary — **the first keystroke that overflows
   * reads the same value synchronously as it does a frame later**, because
   * reading `scrollHeight` forces the layout it needs. The two only part company
   * deep inside an overflow, which is a state the cap means the field can never
   * be in.
   */
  const fits = (el: HTMLTextAreaElement) => el.scrollHeight <= el.clientHeight

  /**
   * **How long the capture was when the box first said no.**
   *
   * ⚠⚠ **THE CAP IS STICKY, AND WITHOUT THIS IT MANGLES WORDS.** Asking only
   * *does this exact string fit* is right about every string and wrong about
   * typing: at the cap a wide letter does not fit and a narrow one still does,
   * so somebody typing `mike` gets `m` refused, `i` **accepted**, `k` and `e`
   * refused — the word arrives as a single letter in the middle of a sentence.
   * Measured: 62 letters kept out of a prefix of 74, in no order a reader could
   * explain. **A full field has to stop taking input, not sieve it.**
   *
   * ⚠ **A length, not a boolean, so a deletion re-opens it with nothing to
   * reset.** The latch holds while the text is as long as it was when it was
   * refused; take a character out and the next one is measured again. There is
   * no `useEffect`, no clearing on blur and no state — a `useRef`, because this
   * changes nothing on screen.
   *
   * ⚠ **It also closes the space leak.** A trailing space hangs at the end of a
   * wrapped line without making a third, so it genuinely fits and was accepted
   * for ever at the cap; the latch refuses it with everything else.
   */
  const fullAt = useRef<number | null>(null)

  /**
   * **The most of `next` that fits, found by asking the element.**
   *
   * ⚠ **Only ever reached by a PASTE.** Typing adds one character, and one
   * character that does not fit is simply refused — so the ordinary keystroke
   * at the cap costs a single measurement and never a search. A paste is worth
   * the seven: **refusing a paste outright would be silent**, and the words
   * would go nowhere with nothing said, which is the failure this screen's own
   * *the confirmation is the row* note exists about.
   *
   * ⚠ **It keeps a PREFIX**, so a paste into the middle of a line loses the
   * tail rather than the pasted words. Stated rather than solved: a caret-aware
   * trim is two more cases for a keystroke nobody has reported making.
   */
  function longestThatFits(el: HTMLTextAreaElement, next: string) {
    let lo = 0
    let hi = next.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      el.value = next.slice(0, mid)
      if (fits(el)) lo = mid
      else hi = mid - 1
    }
    return next.slice(0, lo)
  }

  const host = useRef<HTMLDivElement | null>(null)
  const floorAnchor = useRef<HTMLDivElement | null>(null)
  const field = useRef<HTMLTextAreaElement | null>(null)

  /*
    ⚠ **`writing`, never `focused`.** Four things on the capture page broke by
    keying off focus and all four for one reason — focus is a resting state, not
    an event. Here the field is not autofocused, so the two happen to coincide;
    the hook still takes the gesture's word rather than the DOM's.
  */
  useKeyboardHem({ writing, host, floorAnchor })

  /**
   * **Save one line.**
   *
   * ⚠ **Optimistic, and it has to be.** The four-second criterion is the
   * product's one measured quality: the field clears on the keystroke, not on
   * the round trip. What comes back is only ever a failure to report.
   *
   * ⚠ **A fresh client mutation id per submission** — §10. It makes a *retry*
   * idempotent; it does not protect against two submissions in one gesture, so
   * `sending` guards that instead.
   */
  const sending = useRef(false)
  async function commit() {
    const text = draft.trim()
    if (!text || sending.current) return
    sending.current = true

    setDraft('')
    setLanded(text)
    setFailed(null)

    const result = await captureAction({
      text,
      clientMutationId: crypto.randomUUID(),
    })
    sending.current = false

    if (!result.ok) {
      /*
        ⚠ **The words go back in the field, not into a message.** A capture that
        failed is a capture somebody still means to make, and the only useful
        place for it is where they can send it again.
      */
      setLanded(null)
      setFailed(result.message)
      setDraft(text)
    }
  }

  return (
    <div ref={host}>
      <Bar />

      {/*
        ⚠ **The browse half's space, and it is empty on purpose.** See the head
        of this file. It holds the column open so the composer sits on the
        bottom edge rather than under the bar, which is where it will be once
        there is a rail in here.
      */}
      <main className="gutter mx-auto flex min-h-svh w-full max-w-[var(--record-measure)] flex-col pt-[calc(var(--bar-height)+1.25rem)] pb-[calc(var(--foot-height)+var(--leading-line)*3)]" />

      {/* A zero-height fixed twin on the viewport's bottom edge — see `useKeyboardHem`. */}
      <div ref={floorAnchor} aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-0" />

      {/*
        ⚠ **`writing-sheet`, the same box the record's strip uses**, so the
        composer sits on the bottom edge, rides `--keyboard-overlap` while the
        keys are up, and spends the notch's clearance only while the notch is
        what is underneath. That expression must stay on this element and never
        move into a token — a `var()` is substituted where it is *declared*, and
        `--keyboard-overlap` is written onto `host` below `<body>`.
      */}
      {/*
        ⚠⚠ **THE STRIP HAS NO GROUND, AND THAT IS THE CONSOLE'S ARRANGEMENT —
        directed 5 September.** It wore the record strip's glass, and with the
        card now wearing the console's the two nested: a backdrop filter filters
        what is behind it **including the outer one's result**, so the card would
        have been 38% over 38% at 24px blur under 18px more. **A glass card
        inside a glass box is not the console** — the console is a transparent
        positioner over a blurred scrim holding one glass card, and one glass
        surface is the whole point of the effect.

        ⚠ **What this costs, and it is not payable yet: the foot loses its
        ground.** On the record the foot rides inside the strip's glass because
        the record scrolls under it. Here it sits on the page. **Invisible today**
        — the page behind it is black — and the question comes back the day the
        browse half lands, at which point it depends on whether the rail scrolls
        under the foot or stops above the composer. **Do not pre-build a ground
        for it; look at it then.**
      */}
      <div className="writing-sheet z-20">
        {/*
          ⚠ **A hem under the box, and it is doing two jobs at once.** Idle it is
          the air between the box and the foot, which were touching; writing it is
          the air between the box and the top of the keyboard, where the strip is
          parked. **A rounded box needs it where a bare line did not** — the
          record's field is a line and can sit hard on the keys, and this is a
          surface with a corner radius, which reads as cut off when it meets an
          edge.
        */}
        <div className="gutter mx-auto w-full max-w-[var(--record-measure)] pb-[calc(var(--line-hem)*1.5)]">
          {/*
            ⚠ **The receipt sits above the field, in the record's own type.**
            One line, truncated exactly as a row of the record truncates, so the
            words look the same here as they will there.
          */}
          {landed !== null && (
            <p
              dir="auto"
              className="text-muted truncate px-[calc(var(--line-hem)*2.5)] pb-[var(--line-hem)] text-[length:var(--text-line)] leading-[var(--leading-line)]"
            >
              {landed}
            </p>
          )}

          {failed !== null && (
            <p className="text-decline px-[calc(var(--line-hem)*2.5)] pb-[var(--line-hem)] text-[length:var(--text-line)] leading-[var(--leading-line)]">
              {failed}
            </p>
          )}

          {/*
            ⚠⚠ **A BOX, AND IT IS A LIFTED GROUND RATHER THAN GLASS — reported
            from a handset, 5 September: *the composer itself isn't especially
            visible.*** It was the bars' glass, which is what the record's strip
            wears, and **that is exactly why it disappeared**: glass reads as a
            surface because the record passes under it at full strength, and on
            this screen **there is no record under it**. The browse half is not
            built, so what is behind the composer is the page's own true black.

            ⚠⚠ **THIS REPOSITORY HAS ALREADY ANSWERED THIS ONCE, FOR THE
            CONSOLE.** Its note reads: *its ground lifts toward
            `--color-surface` rather than sinking toward the page — the strip's
            glass recipe made the card **invisible** on a true-black page, because
            a floating card has no borrowed edge.* **The composer has no borrowed
            edge either.** Same problem, same answer, and the second time it has
            been found by looking at a handset rather than by reasoning.

            ⚠ **The direction said *box* twice** — *a box in which to type and
            attach things before submitting* — so this is not an invention to
            solve a visibility bug; it is the thing that was asked for, and the
            bug is what made it obvious that glass was not it.

            ⚠ **The strip behind it keeps the glass**, which does nothing on a
            black page today and is the right thing the day cards scroll under
            it. **Do not delete it to tidy up.**
          */}
          {/*
            ⚠⚠ **GLASS, WHICH IS THE CONSOLE'S OWN RECIPE — directed 5
            September, with the cost stated and accepted.** `--glass-tint` over
            `blur(--glass-blur)` on a handset; `--color-surface` and no blur at
            and above `--breakpoint-stack`, where `console-card` says *nothing
            behind it in flow*. **Byte for byte what a console wears.**

            ⚠⚠ **AND IT IS NEARLY INVISIBLE TODAY, WHICH IS THE POINT OF THE
            CHOICE.** 38% black over black is black. What makes a console read as
            an object is not its own edge — it is **a sharp card against a
            blurred record**, and the browse half that will be behind this is not
            built. The alternative offered was to keep the solid
            `--color-surface` until the rail lands and switch then; **glass now
            was chosen deliberately**, so that when the rail arrives the composer
            is already the lens rather than becoming one.

            ⚠ **So if this reads as *the composer disappeared again*, that is the
            known price and not a regression.** The fix is the browse half, not a
            ground. See `docs/re-direction/the-front-page.md` §5.
          */}
          <div
            className={`composer-glow ${writing ? 'composer-glow-tight' : ''} rounded-2xl bg-[var(--glass-tint)] p-[var(--page-lead)] backdrop-blur-[var(--glass-blur)] stack:bg-[var(--color-surface)] stack:backdrop-blur-none`}
          >
          {/*
            ⚠⚠ **THE FIELD IS MOUNTED AT ALL TIMES.** iOS raises a keyboard only
            for a focus that happens *inside* the gesture that asked for it, so
            a field mounted by a state change is focused a tick too late.
            **Never make this conditional and never move its focus into an
            effect** — that has survived every redesign of the writing strip and
            it survives this one.
          */}
          <textarea
            ref={field}
            rows={1}
            /*
              ⚠ **`dir="auto"`, so the words run from the edge the first strong
              character asks for.** One standard attribute instead of a locale
              branch.
            */
            dir="auto"
            value={draft}
            placeholder="Anything"
            /*
              ⚠⚠ **THE CAP LIVES HERE, AND IT REFUSES RATHER THAN TRUNCATES.**
              The element already holds the new value by the time this runs, so
              the question *does it fit* is asked of the thing itself. If it
              does not, the DOM is put back to the value React last rendered —
              which is what makes the refusal invisible: no state changes, so
              nothing re-renders, and the character simply never appears.

              ⚠⚠ **THE CARET IS PUT BACK BY WHAT WAS DROPPED, NOT TO WHERE IT
              IS.** `selectionStart` here is the position *after* the character
              that is being refused, so restoring the value and leaving the caret
              alone moves it one to the right — a refused keystroke in the middle
              of a line would walk the caret along and the next one would land in
              the wrong place. Measured: it read 6 where it had been 5, the whole
              time this was written the other way. So the offset is the
              difference between what was offered and what was kept, which is 1
              for a refusal and the trimmed tail for a paste, clamped at both
              ends because a paste can start before the caret.


            */
            onChange={(e) => {
              const el = e.currentTarget
              const next = el.value
              /*
                ⚠ **A deletion always lands, and it un-latches.** Less text than
                fitted a moment ago still fits, so there is nothing to measure —
                and the box is no longer full, so the next character is asked
                about again.
              */
              if (next.length < draft.length) {
                fullAt.current = null
                setDraft(next)
                return
              }
              /*
                ⚠ **A full field takes nothing, whatever the letter is.** This is
                the sticky half; without it the cap sieves narrow characters
                through and words arrive in pieces.
              */
              const latched = fullAt.current !== null && draft.length >= fullAt.current
              if (!latched && fits(el)) {
                setDraft(next)
                return
              }
              const caret = el.selectionStart ?? next.length
              /*
                ⚠ **One character over is refused; a paste is trimmed.** The
                search is worth its measurements only when there is something to
                find, and at the cap every further keystroke would otherwise pay
                for one.
              */
              const kept = next.length - draft.length > 1 ? longestThatFits(el, next) : draft
              /*
                ⚠ **A trimmed paste latches at what it KEPT.** Latching at the
                length that was offered would leave the field refusing input it
                has room for, and latching not at all would let the next narrow
                character through — the sieve again, one keystroke later.
              */
              fullAt.current = kept.length
              el.value = kept
              const back = Math.max(0, Math.min(caret - (next.length - kept.length), kept.length))
              el.setSelectionRange(back, back)
              if (kept !== draft) setDraft(kept)
            }}
            onFocus={() => setWriting(true)}
            /*
              ⚠ **Losing focus is leaving.** iOS's own *Done* takes the focus and
              says nothing else, so a mode wired only to gestures the page can
              see stands with no keyboard under it. This is the one fact true of
              every exit.
            */
            onBlur={() => setWriting(false)}
            onKeyDown={(e) => {
              /*
                ⚠ **Return commits; it does not open a line.** A capture is one
                line — the wrap is soft. Shift+Return is deliberately not an
                escape hatch to a second line, because the record has nowhere to
                draw one.
              */
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void commit()
              }
              if (e.key === 'Escape') {
                setDraft('')
                e.currentTarget.blur()
              }
            }}
            /*
              ⚠⚠ **THE BOX NEVER CHANGES SIZE — directed 5 September.** It grew
              with the words in it, measured off `scrollHeight`, from two lines
              to six. **It is two lines, always**, and when there is more than
              that the words scroll inside it: `overflow-y-auto` on a fixed
              height, with the engine keeping the caret in view. **Do not put a
              `min-h`/`max-h` pair back** — a range is a box that resizes, which
              is the thing this removes.

              ⚠ **What it buys: the composer, the light behind it and the foot
              under it are one shape that never moves.** A growing box moved the
              card's top edge, the glow's box and the strip's height on every
              keystroke past the second line — three things animating while
              somebody types, on the one screen whose promise is that writing is
              instant.

              ⚠ **`resize-none`, and it matters more now.** A drag handle on a
              deliberately fixed box is a control that undoes the rule.
            */
            /*
              ⚠ **`overflow-y-hidden`, not `auto`, and that is the cap stated
              twice on purpose.** Nothing can overflow by typing, so `auto` would
              be an offer the field never makes; `hidden` says the box is the
              whole of it. ⚠ **What it costs, and it is the one hole in this:**
              a capture that fitted when it was typed can stop fitting if the
              type reflows under it — a rotation, or a desk window narrowed —
              and what does not fit is then clipped rather than scrolled to.
              **The alternative was trimming somebody's words on a resize**,
              which is worse; the cap is about what can be written, not a
              promise about every width it might later be read at.

              ⚠ **`composer-bar` is gone with the scroll it hid**, and so is
              `resize-none`'s neighbour `overflow-y-auto`. `resize-none` stays:
              a drag handle on a fixed box is still a control that undoes the
              rule.
            */
            className="page-input block h-[calc(var(--leading-line)*2)] w-full resize-none overflow-y-hidden text-[length:var(--text-line)] leading-[var(--leading-line)]"
          />

          {/*
            ⚠⚠ **THE CONSOLE'S OWN ROW, TO THE PIXEL — directed 5 September:
            *it should have the same aesthetic as the console that opens when a
            user taps an item in their list.*** `-mx-[--page-lead]` cancels the
            card's padding so the row spans its full width, `grid-cols-4` with
            the left controls at `col-span-3` and one control at `col-start-4`,
            `--glyph-foot` throughout. It is `console.tsx`'s controls row with
            different occupants, which is what *the same aesthetic* has to mean
            if it is to mean anything checkable.

            ⚠ **And it is what a composer looks like** — the words above, the
            controls along the bottom edge inside the box. The two answers agreed,
            which is why this is one change and not two.

            ⚠ **`col-start-4` is inherited from the console and is NOT claimed to
            mean anything here.** There it is the settle glyph, deliberately on
            the foot tray's x centre as a sight line for a reaction that is not
            built. Send lands on the same column because the row is the same row.
            **If a sight line is ever wanted for a capture going to the record,
            the column to aim at is TWO** — that is where the record's glyph is.
          */}
          <div className="-mx-[var(--page-lead)] mt-4 grid grid-cols-4 items-center [--glyph:var(--glyph-foot)]">
            <div className="col-span-3 flex items-center gap-5 ps-[var(--page-lead)]">
              {/*
                ⚠ **Attach is drawn OFF until there is a Blob store**, which is
                the foot's rule — *controls go off; they do not disappear* — and
                the same one the record's camera already follows. A `<span>`,
                because there is no disabled state for a control that opens
                something, and the label goes with the door rather than staying on
                a drawing a reader would be told they can reach.

                ⚠ **It is here from the first build on purpose.** The direction
                was *a box in which to type and attach things before submitting*;
                a row that arrives empty and grows a control later is a row whose
                shape nobody could judge. See step 4 of the brief.
              */}
              {imagesOn ? (
                <button
                  type="button"
                  aria-label="Attach a photograph"
                  className="text-chrome tap-target flex items-center"
                >
                  <AttachGlyph />
                </button>
              ) : (
                <span aria-hidden className={`tap-target flex items-center ${OFF}`}>
                  <AttachGlyph />
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => void commit()}
              aria-label="Save it"
              disabled={draft.trim() === ''}
              className={`tap-target col-start-4 flex items-center justify-self-center transition-colors ${
                draft.trim() === '' ? OFF : 'text-chrome'
              }`}
            >
              <SendGlyph />
            </button>
          </div>
          </div>
        </div>

        {/*
          ⚠⚠ **THE FOOT IS THE STRIP'S SECOND ROW, AND IT HAS TO BE INSIDE THIS
          BOX — found by looking at it, 5 September.** `Foot` renders a
          `<footer>` carrying `col-start-1 row-start-1`: on the record those
          place it in the strip's **one-cell grid**, where the glyph row and the
          field share a cell so the strip cannot resize between its two states.
          Rendered outside any grid it has no positioning at all — it fell to the
          end of the document, off the bottom of a full-height page, and the
          front page shipped for ten minutes with **no navigation on it**.
          Typecheck, lint and seventeen passing assertions all said nothing; the
          screenshot said it immediately.

          ⚠ **Two ROWS here, where the record has two STATES in one cell**, and
          that is the difference that matters. On the record the glyphs and the
          field are alternatives — you are writing or you are not. Here the
          composer is the page's whole purpose and is never swapped out, so the
          foot sits under it and the box is as tall as both.

          ⚠ **So the foot may be unmounted here, where on the record it may
          not.** The record's rule is about a shared cell: unmounting either
          occupant lets the strip resize, which is the one thing that design
          removed. A row that leaves is *meant* to change the height — while
          somebody writes, the strip is parked on the keyboard's top edge and a
          reserved 44px of glass below the field would be the *gap under the
          characters* bug rebuilt.

          ⚠ **It does not fade, and that is a known rough edge.** `hidden`
          carries the opacity transition and cannot carry a height, so this is a
          hard swap where everything else on the bottom edge moves on
          `--recede`. **If it reads badly, the fix is a collapsing row and not a
          reserved gap.**
        */}
        {!writing && (
          <>
            {/*
              ⚠⚠ **THE DOOR IS HERE AND THE PORTAL IS NOT — 5 September.** The
              portal's rows open **consoles**, and a console only exists where
              the record is. So this door **navigates** to the record with the
              box already open, rather than opening a box it could not fill.

              ⚠ **A door that landed you on a page where you had to find the
              door again would be worse than no door**, which is why this is not
              a plain link to `/record`. See `portalOpen` in `page-screen.tsx`.

              ⚠ **It has to be lit HERE, whatever it costs.** This is the
              landing page: a portal whose door only exists on a screen you have
              to choose to visit is the *silent failure* every one of §9's
              findings turned out to be.
            */}
            {/*
              ⚠⚠ **THE ROW IS `--tap-floor` TALL, AND THAT IS WHAT STOPPED IT
              EATING THE FIELD — reported from a handset, 5 September: *it says
              'Anything' but it's partially obscured by the bottom bar.*** The
              glyph drawing is `--glyph-foot` (26px) and `tap-target` hangs a
              44px hit area off it, **9px past the drawing at each end** — so with
              the row only as tall as its glyphs, the foot's invisible targets
              reached up over the composer's last line and took the taps meant for
              it. Nothing was drawn over the words; **the box that was over them
              was the one you cannot see.**

              ⚠ **On the record this could not happen and the reason is
              structural.** There the foot and the field are two states of **one
              cell**, never on screen together, so the overhang has only the
              record above it — which is why `sheet-glyph` hangs its whole
              target *upward* on purpose. Here they are two **rows**, both
              present, so the row has to contain its own reach.

              ⚠ **44px is the thumb, and it does not scale with the desk's root.**
              That is `--tap-floor`'s whole point: hardware does not get bigger
              because a window did.
            */}
            <div className="flex min-h-[var(--tap-floor)] items-center">
              <Foot
                record="away"
                searchable={searchable}
                portal={() => router.push('/record?portal=1')}
                portalWaiting={portalWaiting}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
