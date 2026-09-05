'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

import { Bar } from './bar'
import { Foot } from './foot'
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
}: {
  /** Phase 2 step 3: is there anything to say. One bit — never a count. */
  portalWaiting: PortalWaiting
  /** Whether there is a record to search. */
  searchable: boolean
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
      <div className="writing-sheet z-20 bg-[var(--sheet-tint)] backdrop-blur-[var(--sheet-blur)]">
        <div className="gutter mx-auto w-full max-w-[var(--record-measure)]">
          {/*
            ⚠ **The receipt sits above the field, in the record's own type.**
            One line, truncated exactly as a row of the record truncates, so the
            words look the same here as they will there.
          */}
          {landed !== null && (
            <p
              dir="auto"
              className="text-muted truncate text-[length:var(--text-line)] leading-[var(--leading-line)]"
            >
              {landed}
            </p>
          )}

          {failed !== null && (
            <p className="text-decline text-[length:var(--text-line)] leading-[var(--leading-line)]">
              {failed}
            </p>
          )}

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
            className="page-input block max-h-[calc(var(--leading-line)*6)] w-full resize-none overflow-y-auto py-[var(--line-hem)] text-[length:var(--text-line)] leading-[var(--leading-line)]"
          />
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
            <Foot
              record="away"
              searchable={searchable}
              portal={() => router.push('/record?portal=1')}
              portalWaiting={portalWaiting}
            />
          </>
        )}
      </div>
    </div>
  )
}
