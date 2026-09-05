'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

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
   * **The box grows with the words in it.**
   *
   * ⚠ **Directed 5 September: the composer wraps, and the record's rows stay
   * one line.** That reverses half of the 28 August rule and leaves what the
   * rule protects intact — the record's density is what fits twenty-four lines
   * on a handset, and none of it is on this screen.
   *
   * ⚠ **Wrapping is SOFT, and a capture is still one line.** Return commits, so
   * there are no hard newlines in the text: what wraps is the display of a long
   * capture, which is the whole reason the box exists — you cannot attach
   * something to words you cannot read back.
   *
   * ⚠ **Height is measured, not counted.** `scrollHeight` after a reset to
   * `auto` is the only figure that survives a different face, a different root
   * scale and a different word — counting characters or `\n`s is a constant
   * waiting to be wrong on the next screen.
   */
  const grow = useCallback(() => {
    const el = field.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

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
    /* The box came back to one line with the words, so it comes back in height too. */
    requestAnimationFrame(grow)

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
      requestAnimationFrame(grow)
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
          <div className="composer-glow rounded-2xl bg-[var(--glass-tint)] p-[var(--page-lead)] backdrop-blur-[var(--glass-blur)] stack:bg-[var(--color-surface)] stack:backdrop-blur-none">
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
            onChange={(e) => {
              setDraft(e.target.value)
              grow()
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
                requestAnimationFrame(grow)
                e.currentTarget.blur()
              }
            }}
            className="page-input block max-h-[calc(var(--leading-line)*6)] min-h-[calc(var(--leading-line)*2)] w-full resize-none overflow-y-auto text-[length:var(--text-line)] leading-[var(--leading-line)]"
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
