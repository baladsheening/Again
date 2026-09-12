'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Bar, OFF } from './bar'
import { Foot } from './foot'
import { AttachGlyph, SendGlyph, UndoGlyph, WriteGlyph } from './glyphs'
import { useKeyboardHem } from './keyboard-hem'
import { touchQuery, useMatches } from './pointer'
import { captureAction, undoCaptureAction } from '@/app/actions/captures'
import type { PortalWaiting } from '@/lib/db'

/**
 * **The front page: the corpus above, a composer below.** Amendment 5, 5
 * September.
 *
 * ⚠⚠ **THE RECORD USED TO BE HERE AND IT IS AT `/record` NOW.** `/` was the
 * record itself from 23 August to 5 September — a blank page you typed down.
 * The direction: *the front page is a place where people can both lodge a
 * thought as quickly as possible and browse by swiping images of experiences
 * and productions.* See `docs/re-direction/inactive/the-front-page.md`.
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
  undoWindowMs,
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
  /**
   * How long the undo beside the receipt stays lit.
   *
   * ⚠ **The server's number, not a second copy of it.** `undoCapture` bounds
   * the delete in SQL against `created_at`; a `10_000` typed here would be a
   * clock that can disagree with the one that decides, and the disagreement
   * would show as a control that is lit and refuses.
   */
  undoWindowMs: number
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
  /**
   * **The capture the receipt is for, while it can still be taken back.**
   *
   * ⚠⚠ **THE UNDO WAS LOST IN THE SPLIT AND THIS PUTS IT BACK.** §5's *nothing
   * is ever deleted* has exactly one exception — a ten-second undo on creation,
   * for typos — and it lived on the record's own row. The record moved to
   * `/record` on 5 September and the front page kept the receipt without it, so
   * for a day the only way to take back a mistyped capture was to navigate to
   * another screen and find it there.
   *
   * ⚠ **Separate from `landed`, because they expire differently.** The receipt
   * stays until the next capture replaces it — it is the confirmation, and a
   * confirmation that vanished after ten seconds would be the toast this screen
   * refuses to be. The *control* is the window.
   */
  const [landedId, setLandedId] = useState<string | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /**
   * **The door to the record has something to say, and has not said it yet.**
   *
   * ⚠ **State, not an event, because the foot is UNMOUNTED while somebody
   * writes.** A capture committed with the keyboard up has no glyph to animate
   * at the moment its window closes; this survives until the foot is on screen
   * and the bounce plays when it mounts. **A signal nobody could have seen is
   * not a signal.**
   *
   * ⚠ **Put down by the animation itself**, through `onAnimationEnd`, rather
   * than by a timer here that would be a second copy of `--recede` written in a
   * language that cannot read it.
   */
  const [arrived, setArrived] = useState(false)
  /**
   * **The line is on its way out.**
   *
   * ⚠ **A state rather than a straight unmount**, so the words can be seen to
   * leave: *the text vanishes as it transfers, or looks to be transferred, to the
   * record.* The line is cleared by the fade's own `animationend`, never by a
   * timer holding a second copy of `--recede`.
   */
  const [leaving, setLeaving] = useState(false)
  const sentLine = useRef<HTMLParagraphElement | null>(null)
  const sentUndo = useRef<HTMLSpanElement | null>(null)
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
  /**
   * **A control in this strip may not take the focus off the field.**
   *
   * ⚠⚠ **WITHOUT THIS THE FIRST TAP ONLY PUTS THE KEYBOARD AWAY — reported from
   * a handset, 5 September: *when I tap the undo it only instructs the app to
   * collapse the keyboard; I have to press it again to actually undo.*** The tap
   * blurred the field, iOS took the keyboard down, the strip travelled from the
   * top of the keyboard to the bottom of the glass, and the button was no longer
   * under the finger when the tap completed. **The second tap worked because by
   * then nothing was moving.**
   *
   * ⚠ **This is the same failure as the one fixed an hour earlier and the guard
   * for that one could not reach it.** `relatedTarget` says *where focus went*,
   * and on iOS a tap on a button focuses nothing at all — it just blurs the
   * field, so `relatedTarget` is `null` and the guard reads it as leaving.
   * **The fix has to stop the blur, not classify it.**
   *
   * ⚠ **`mousedown`, and it is not a mouse.** Focus moves on the compatibility
   * `mousedown` that every engine synthesises from a tap, before `click`;
   * `preventDefault` there cancels the focus change and leaves the click alone.
   * This is the toolbar-button technique, and it is the one thing that works on
   * all four surfaces.
   *
   * ⚠ **Every control in the strip needs it**, not just the one that was
   * reported: send and attach sit in the same box and move the same way.
   */
  const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault()

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

  /**
   * **The card, so a refused keystroke can be answered on it.**
   *
   * ⚠ **The animation is restarted through `classList`, not through state.** A
   * pure refusal deliberately changes nothing React knows about — that is what
   * makes it invisible — so there is no re-render to hang a class on, and a
   * counter in state would be re-rendering the screen to say *nothing happened*.
   * Remove, force a reflow, add: the standard restart, so a held key bumps once
   * per keystroke instead of once ever.
   */
  const box = useRef<HTMLDivElement | null>(null)
  const host = useRef<HTMLDivElement | null>(null)
  const floorAnchor = useRef<HTMLDivElement | null>(null)
  const field = useRef<HTMLTextAreaElement | null>(null)

  /*
    ⚠ **`writing`, never `focused`.** Four things on the capture page broke by
    keying off focus and all four for one reason — focus is a resting state, not
    an event. Here the field is not autofocused, so the two happen to coincide;
    the hook still takes the gesture's word rather than the DOM's.
  */
  /**
   * ─────────────────────────────────────────────────────────────────────────
   *  Only a surface that raises a keyboard rearranges itself — 8 September
   * ─────────────────────────────────────────────────────────────────────────
   *
   * ⚠⚠ **THE DESK DOES NOT MOVE WHEN YOU CLICK IN THE COMPOSER, AND THAT
   * REVERSES A DECISION MADE ON 5 SEPTEMBER.** Reported: *when I tap in the
   * composer it expands but it also drops slightly — do we need the desktop
   * version's composer to expand? If not, leave it as is, including leaving the
   * strip as is, no need even to have the bar recede.*
   *
   * ⚠ **The drop was real and it was the foot row.** Measured at 1440×900,
   * `node_modules/.probe/deskstrip.mjs`: the row closes (−44), the band shrinks
   * to `--gutter-l` (−17.34), the card grows a line (+32) and the hem under it
   * opens (+16.67) — so the strip's top lands **12.68px lower** and the card's
   * bottom **27.32px lower**. ⚠ **On the desk the `<footer>` is `stack:hidden`,
   * so that 44px row is an empty box that exists only to balance the band** —
   * the whole rearrangement was moving air around a foot nobody can see.
   *
   * ⚠⚠ **THE NOTE THIS REVERSES SAID: *the desk grows too, which is deliberate
   * — a pointer-type branch would be a device sniff for a behaviour that reads
   * correctly on both.* THE FIRST HALF WAS RIGHT AND THE SECOND WAS BACKWARDS.**
   * `pointer.ts` has argued since 18 August that `(pointer: coarse)` is **a
   * capability, not a device**, and it is exactly the capability at issue:
   * every one of these movements exists because **a software keyboard is about
   * to cover the bottom of the screen**, and that is what a coarse pointer
   * predicts. Asking it is not sniffing; assuming it is what was wrong.
   *
   * ⚠⚠ **A HAND, NOT A WIDTH, AND THE TWO GIVE DIFFERENT ANSWERS HERE.** A desk
   * window dragged narrow raises no keyboard and must not move; **an iPad in
   * landscape is wider than `--breakpoint-stack` and does**. A width gate would
   * get both of those wrong, which is `pointer.ts`'s own founding argument
   * arriving in a second place.
   *
   * ⚠ **`false` until mount, and nothing here may read it before then.** Every
   * consumer below is downstream of a focus, which is always after the
   * correction — the same condition `page-screen.tsx` states for its own copy.
   *
   * ⚠ **`writing` still means what it always did**, and the field's own
   * handlers are untouched: a desk click still focuses, still commits, still
   * blurs. **What is gated is only the screen making room.**
   */
  const touch = useMatches(touchQuery)
  const makingRoom = writing && touch

  useKeyboardHem({ writing: makingRoom, host, floorAnchor })

  /*
    ⚠⚠ **THE COMPOSER MEASURES ITSELF, AND THE RAIL FILLS WHAT IS LEFT — 6
    September.** Directed: *there's a big space between the rail and the top of
    the sheet the composer lays on.* There was, and `main` was reserving
    `--foot-height + 3 lines` for a strip that is really **a card, a hem and a
    foot** — a guess at somebody else's height, and wrong by whatever the card
    happened to be.

    ⚠ **So it is read off the element rather than computed from the tokens.**
    The same rule `readRoll` and the swipe's detent were built on: *measure the
    thing, never re-derive it.* The composer grows a line when somebody writes,
    and this follows it with nothing told about that.

    ⚠ **A `ResizeObserver`, not an effect that runs once.** The strip changes
    height when the field grows, when the failure line appears, and when the
    desk's root scale ramps — three occasions, one observer.

    ⚠ **Written through the CSSOM onto `host`, which is what `--keyboard-overlap`
    already does** — §10 blocks inline `style` attributes, and this is the door
    that rule leaves open. ⚠ **It must NOT be lifted into `@theme`**: a
    custom property's `var()` is substituted where it is *declared*, so a token
    on `:root` would resolve this against `:root`, where nothing writes it. That
    bug cost a day on 29 August.
  */
  const sheet = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const box = sheet.current
    const root = host.current
    if (!box || !root) return
    const observer = new ResizeObserver(([entry]) => {
      /*
        ⚠⚠ **THE BORDER BOX, NOT `contentRect`.** `writing-sheet` spends the
        notch's clearance as `padding-block`, and `contentRect` is the
        **content** box — so the reserve was short by that padding and the rail's
        floor sat **18px below the strip's top edge** on every notched handset.
        The strip occupies its border box; that is the number to keep clear of,
        and the rail's floor is now a picture's edge rather than empty page.
      */
      const measured = entry.borderBoxSize?.[0]
      root.style.setProperty(
        '--sheet-block',
        `${measured ? measured.blockSize : entry.contentRect.height}px`,
      )
    })
    /*
      ⚠⚠ **`box: 'border-box'`, OR THE CLEARANCE IS NEVER SEEN.** The default is
      the **content** box, so a change that is purely `padding-block` — which
      `env(safe-area-inset-bottom)` is — moves nothing being watched and **fires
      no callback at all**, leaving the reserve at whatever it was before the
      inset existed.
    */
    observer.observe(box, { box: 'border-box' })
    return () => observer.disconnect()
  }, [])

  /**
   * **Put the undo at the end of the words, on whichever line they end on.**
   *
   * ⚠⚠ **MEASURED FROM THE LAST CHARACTER, NOT FROM THE BOX.** A control parked
   * at the end of the *box* is stranded out at the margin after a short capture
   * with a gap of nothing between it and the text — the record reported exactly
   * that the hour it was built the other way. A `Range` over the final character
   * gives where the words actually stop.
   *
   * ⚠ **Through the CSSOM.** §10 blocks inline `style` attributes in production
   * and the linter enforces it, so this writes custom properties — the same door
   * the roll mark used before it was deleted.
   *
   * ⚠ **Direction is read off the element, never assumed.** The line carries
   * `dir="auto"`, so in Arabic the end of the last line is its LEFT edge and the
   * control belongs there. One `getComputedStyle` instead of a locale branch.
   */
  useEffect(() => {
    const line = sentLine.current
    const holder = sentUndo.current
    const node = line?.firstChild
    if (!line || !holder || !node || !node.textContent) return

    const range = document.createRange()
    range.setStart(node, node.textContent.length - 1)
    range.setEnd(node, node.textContent.length)
    const last = range.getBoundingClientRect()
    const base = line.getBoundingClientRect()
    const rtl = getComputedStyle(line).direction === 'rtl'
    const gap = holder.offsetWidth

    holder.style.setProperty(
      '--undo-x',
      `${rtl ? last.left - base.left - gap : last.right - base.left}px`,
    )
    holder.style.setProperty('--undo-y', `${last.top - base.top}px`)
  }, [landed, landedId])

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
  /*
    ⚠ **`updateDate` stood here and is deleted — 12 September, directed.** It
    sent the words back for the composer's *Update*, which existed because a
    live twin was refused. **The same flow applies to a live twin now**, so
    `writeCapture` moves the line itself and there is nothing to offer.
  */
  const sending = useRef(false)
  async function commit() {
    const text = draft.trim()
    if (!text || sending.current) return
    sending.current = true

    /*
      ⚠⚠ **THE LATCH GOES WITH THE WORDS IT WAS SET ON.** `fullAt` is a length,
      and lengths outlive the text they measured: left behind, a capture that
      filled the box at 73 characters would make the *next* capture stop dead at
      73 — even 73 narrow ones the box has room for. The deletion path clears it
      because the field is getting shorter; this is the other way the field
      empties, and it was missed when the latch was written.
    */
    fullAt.current = null
    setDraft('')
    setLanded(text)
    setFailed(null)
    /*
      ⚠⚠ **A COMMIT ENDS THE WRITING MODE, AND THIS SCREEN SHOULD HAVE INHERITED
      THAT ON DAY ONE.** Directed 27 August for the record's own strip — *once a
      line is submitted the person is presumed done* — and the front page was
      written without it. Reported 5 September: **the bounce of the record glyph
      cannot be seen when the keyboard is up.** It could not: the foot is
      unmounted while somebody writes, so the door that acknowledges the capture
      is not on screen at the moment it has something to say.

      ⚠ **The fix is the rule, not a second signal.** Letting go of the keyboard
      brings the foot back, so the receipt, its undo, the window closing and the
      door's bounce all happen on a screen that is showing them. Nothing new is
      drawn.

      ⚠ **What it costs, stated: a run of captures is a tap back into the field
      between each.** That is the 27 August trade exactly, taken there with the
      cost written down, and it is the reason the field is mounted at all times —
      the tap back costs one gesture and raises the keyboard synchronously.

      ⚠ **`blur()` and not `setWriting(false)`.** The mode has one exit and it is
      the field losing focus; setting the state directly would leave a focused
      field in a screen that thinks nobody is writing, which is the state iOS's
      own *Done* used to produce.
    */
    field.current?.blur()

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
      setLandedId(null)
      setFailed(result.message)
        setDraft(text)
      return
    }

    /*
      ⚠ **The window opens when the row exists, not when the words left the
      field.** The receipt is optimistic on purpose — the four-second capture is
      the one measured quality this screen has — but there is nothing to undo
      until the server says what it wrote, and an undo glyph over a capture with
      no id is a control that cannot act.
    */
    if (undoTimer.current) clearTimeout(undoTimer.current)
    /*
      ⚠⚠ **NO UNDO ON A LINE THAT CAME BACK — 12 September.** A crossed-off line
      written again is accepted, and `created` is `false` on it: the row is the
      one that was already there, moved to today with its earlier date filed
      behind it. **Undo DELETES**, so lighting the glyph would offer to destroy
      a line with a note, a photograph, provenance and a history on it — and
      `undoCapture` bounds itself on `created_at`, so it would refuse anyway.
      **A control that is lit and refuses** is the exact failure this file
      already records about client clocks disagreeing with the one that decides.

      ⚠ **The landing itself is unchanged.** The words still go solid, blink and
      leave, and the door still bounces — what is missing is a glyph for an act
      that does not exist. The `+` goes with it, because it exists only to skip
      the undo's wait.
    */
    if (result.value.created) setLandedId(result.value.id)
    /*
      ⚠⚠ **THE RECEIPT GOES WITH THE WINDOW — directed 5 September, and it
      REVERSES what was written here this morning.** That note read: *the receipt
      stays until the next capture replaces it; a confirmation that vanished
      after ten seconds would be the toast this screen refuses to be.* The
      direction is that it should go, **and the reasoning holds because something
      takes its place**: the record's own glyph bounces at the same instant, so
      the screen stops saying *here is what you wrote* and starts saying *it is
      in there*. A toast leaves nothing behind; this hands over.

      ⚠ **One timer for all three**, because they are one event. Two timers on
      one moment is two clocks to keep in step.
    */
    undoTimer.current = setTimeout(() => {
      /*
        ⚠ **The words are not cut, they LEAVE.** `leaving` runs the fade and the
        fade's own `animationend` clears the line — so the duration is stated in
        the stylesheet and nothing here holds a copy of it. The door bounces on
        the same tick, which is what makes the two read as one event: the line
        goes to the record and the record says it arrived.
      */
      setLandedId(null)
      setLeaving(true)
      setArrived(true)
    }, undoWindowMs)
  }

  /**
   * **Take the last capture back, and give the words back with it.**
   *
   * ⚠⚠ **THE WORDS RETURN TO THE COMPOSER, WHICH THE RECORD'S UNDO DOES NOT
   * DO.** It is the same act on a surface that can finish it: the undo exists
   * *for a typo*, a typo is something you meant to write and got wrong, and on
   * the record there is no field to put it back into. Here there is one, empty,
   * directly below. Undoing and then retyping eighty characters would be the
   * four-second capture spent twice.
   *
   * ⚠ **Only into an EMPTY composer.** If something is already being written,
   * the words stay taken back rather than landing in the middle of a sentence
   * somebody is in the middle of. **Do not "fix" this by appending** — a capture
   * is one line and two of them run together are neither.
   *
   * ⚠ **A refusal puts the receipt back, and it has to.** `undoCapture` bounds
   * the delete in SQL against `created_at` rather than trusting the client's
   * word for how long ago the line landed, so the clock here and the clock there
   * can disagree; the honest answer to *too late* is the capture still being
   * there. Same argument as the record's, which says so in the same words.
   */
  /**
   * **Let it go now, rather than waiting the window out.**
   *
   * ⚠⚠ **DIRECTED 5 September:** *a `+` replaces the arrow for the duration that
   * the undo is available, so users can tap it if they don't want to wait ten
   * seconds for the transfer to happen.* The window exists to give the words
   * back, not to hold anybody up — **this is the way to say *I meant it*.**
   *
   * ⚠ **It is the timer's own ending, run by hand.** Same three effects in the
   * same order — the control goes, the line leaves, the door bounces — so there
   * is one description of what the end of a window is and two ways to reach it.
   * **Do not let these drift apart.**
   *
   * ⚠⚠ **IT DOES NOT RAISE THE KEYBOARD, AND IT DID FOR AN HOUR — reported:
   * *why when I press + does the keyboard pop up again?*** It focused the field
   * on the reasoning that a `+` means *start another one*. **That reasoning cost
   * the control the one thing it exists for:** focus raises the keyboard, the
   * keyboard unmounts the foot, and the foot is where the door is — so tapping
   * *do the transfer now* hid the only thing that says the transfer happened.
   *
   * ⚠ **The wait is what is being skipped, not the next capture.** The box is
   * left empty and lit, and writing again is the tap it has always been.
   */
  function acceptNow() {
    if (landedId === null) return
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setLandedId(null)
    setLeaving(true)
    setArrived(true)
  }

  /**
   * **Take the capture back, and put the writer back in the middle of it.**
   *
   * ⚠⚠ **DIRECTED: *if a user taps undo, s/he doesn't delete the text written
   * but re-engages it so they can edit it as they please.*** So this is not the
   * record's undo, which erases a line and leaves nothing — the words go back
   * into the field **and the field takes the focus**, which raises the keyboard
   * with the caret at the end. The capture row is deleted; the writing is not.
   *
   * ⚠ **It replaces whatever is in the field.** There is nothing to protect: the
   * box has been showing the sent line for the whole window, so a draft
   * underneath it is not a thing anybody could have been looking at.
   *
   * ⚠ **A refusal puts the line back.** `undoCapture` bounds the delete in SQL
   * against `created_at` rather than trusting the client's word for how long ago
   * it landed, so the two clocks can disagree and the honest answer to *too late*
   * is the capture still being there.
   */
  function undo() {
    const id = landedId
    const text = landed
    if (!id || text === null) return

    /*
      ⚠ **The bounce is cancelled with the capture it was for.** The window's
      timer is what fires it, so clearing the timer is enough — but `arrived`
      may already be up from a capture before this one, and a door announcing an
      arrival at the moment one is taken back is the screen contradicting itself.
    */
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setArrived(false)
    setLandedId(null)
    setLanded(null)
    setLeaving(false)
    setDraft(text)
    /*
      ⚠ **Focus in the handler, never in an effect.** iOS raises a keyboard only
      for a focus that happens inside the gesture that asked for it, and this is
      that gesture. The caret goes to the end so the next keystroke continues the
      sentence rather than landing wherever the value happened to leave it.
    */
    const el = field.current
    if (el) {
      el.focus()
      el.setSelectionRange(text.length, text.length)
    }

    void undoCaptureAction(id).then((result) => {
      if (!result.ok) {
        setLanded(text)
        setFailed(result.message)
        setDraft('')
      }
    })
  }

  return (
    <div ref={host}>
      {/*
        ⚠⚠ **THE BAR LEAVES ON PURPOSE WHILE SOMEBODY WRITES — 7 September,
        directed, and it is a DESIGN ANSWER TO A PLATFORM PROBLEM RATHER THAN A
        CORRECTION OF IT.**

        Established on a front page stripped to nothing but the strip, which is
        the only reason it could be established at all. iOS does not shrink the
        layout viewport for a keyboard; it pans the **visual** viewport down
        inside it, on the compositor. A `fixed` box is anchored to the layout
        one, so:

        - with `top: 0` the bar left the screen and **never came back** —
          reported in those words;
        - with `top: var(--viewport-top)` it left and came back **a frame
          later**, which is the jolt, reported in those words too.

        ⚠⚠ **THERE IS NO CSS LENGTH THAT TRACKS THE VISUAL VIEWPORT, SO EVERY
        CORRECTION IS MAIN-THREAD AND THEREFORE LATE.** That is not a bug to
        find; it is the shape of the platform. **So the bar is not corrected —
        it is sent away.** It recedes on the app's own `--recede` and
        `--ease-recede` at the moment of focus, iOS then pans a bar that is not
        on screen, and there is nothing left to jolt.

        ⚠ **`receded` already existed and this is its second tenant.**
        `useChromeRecede` decides it on the record; here the gesture decides it,
        which is the same rule the foot already follows — it is unmounted while
        somebody writes, for the same reason: **nothing in the chrome can act
        while a keyboard is up.**

        ⚠ **The stated cost, which was weighed and accepted:** the top of the
        screen is empty while you write. That is chosen rather than imposed.

        ⚠⚠ **THIS BLOCK USED TO SAY `top-[var(--viewport-top)]` STAYS ON
        `bar.tsx`. IT IS NOT THERE — the bar is `top-0`.** That correction was
        tried on 7 September and measured worse three ways; `bar.tsx` holds the
        readings. **A comment describing a mechanism that is not there is worse
        than no comment**, because the next reader trusts it.

        ⚠⚠ **AND DO NOT ANSWER THE BAR'S PAN BY TAKING THE STRIP OUT OF `fixed`.
        THAT WAS TRIED ON 7 SEPTEMBER AND REVERTED — see the tombstone on
        `writing-sheet`'s `position`.**
      */}
      <Bar receded={makingRoom} />

      {/*
        ⚠⚠ **THE BROWSE HALF IS GONE FROM THIS PAGE — 7 September, directed:
        *do this from scratch, from first principles; wipe out everything on the
        front page currently in existence except the strip and the way things
        work in the composer that we settled days ago.*

        ⚠⚠ **THE REASON IS THAT THE KEYBOARD AND THE RAIL WERE ENTANGLED, AND
        NEITHER COULD BE JUDGED WITH THE OTHER ON SCREEN.** Five fixes were
        built and deployed in one day for *the page jolts when I tap in the
        composer* and *the images don't resize properly*, and every one of them
        corrected the wrong half, because a page that moves and a rail that
        resizes late look the same from a handset. **With nothing here but the
        strip, "does it jolt" has exactly one possible cause.**

        ⚠ **The corpus is untouched.** `possibilities`, `listRail`,
        `items_rail_idx` and the backfills all stay; it is the reader that has
        gone. `components/rail.tsx` is deleted and is in git at `395b767`.

        ⚠⚠ **NOTHING BELOW THIS LINE CHANGED.** The strip, the card, the
        measured cap, the third line on focus, the line that lands in place, the
        undo, the `+`, the failure line and the foot are exactly as they were.
        **That was the condition this was done under and it is the thing to
        check first if anything about writing feels different.**

        ⚠ **`main` stays as the page's landmark and its height.** It has no
        padding for a bar or a reserve for the sheet any more, because it has
        nothing in it to keep clear of them.
      */}
      <main className="gutter mx-auto h-svh w-full max-w-[var(--record-measure)]" />

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
      {/*
        ⚠⚠ **THE BOTTOM-THIRD FLOOR IS GONE, AND IT WAS WHAT MADE THE BAND LOOK
        BIGGER THAN THE FOOT — 7 September, reported from a handset.** The strip
        carried `min-block-size: (100svh − --keyboard-overlap) / 3` with
        `justify-end`, and its own note said in writing that *what the floor adds
        is empty strip over the band*. Measured idle at 390×844: content 225.5
        against a third of 281.33, so **55.83px of empty glass sat above a 44px
        band** — the reader sees 99.83 above the card against 51.5 below it, and
        the band and the foot's row being equal at 44 each is invisible
        underneath that.

        ⚠⚠ **THE CONDITION IT WAS DIRECTED UNDER NO LONGER EXISTS.** It was
        directed 6 September as *I want the bottom third of the screen to the
        composer and the sheet and that part of the screen; **the images can
        exist in the top two thirds** between the logo row and the bottom third*
        — a reservation of the bottom third **against the rail**.
        `components/rail.tsx` was deleted on 6 September (`a7be55c`), so the
        floor has been holding a third of the screen against nothing.
        **Subtraction rather than a correction**, which is the order
        `CLAUDE.md`'s *How things get fixed* asks for.

        ⚠ **IT COMES BACK WITH THE RAIL, AND IT IS ONE CLASS:**
        `max-stack:min-h-[calc((100svh_-_var(--keyboard-overlap,0px))/3)]`. What
        it must carry back with it is recorded here rather than lost — the
        `100svh − --keyboard-overlap` term, because a third of the whole display
        with the keys up is 620px of 852 claimed **on top of** the keyboard; a
        **floor** rather than a height, so a failure line or a third line of
        writing can still make the strip taller; `justify-end`, so the room goes
        above the content and the composer's bottom edge never moves; and
        `max-stack:`, because on the desk the strip is the field alone and a
        third of a tall window is a great empty pane of glass over one line.

        ⚠ **The writing state never used it and does not change.** With the keys
        up the content is already taller than a third of what is left visible —
        20 + 154 + 20 against 169 on this handset — so the floor was inactive
        there. **Only the idle glass moved**, and nothing about the composer did.
      */}
      <div
        ref={sheet}
        className={`writing-sheet z-20 flex flex-col justify-end ${makingRoom ? 'sheet-over-keys' : ''}`}
      >
        {/*
          ⚠ **A hem under the box, and it is doing two jobs at once.** Idle it is
          the air between the box and the foot, which were touching; writing it is
          the air between the box and the top of the keyboard, where the strip is
          parked. **A rounded box needs it where a bare line did not** — the
          record's field is a line and can sit hard on the keys, and this is a
          surface with a corner radius, which reads as cut off when it meets an
          edge.
        */}
        {/*
          ⚠⚠ **THE AIR UNDER THE CARD IS THE AIR BESIDE IT WHILE SOMEBODY
          WRITES — 7 September, directed.** `gutter` is what holds the card off
          the screen's edges, so with the foot gone the card is inset by the
          same amount on all four sides: `--gutter-l` above it in the band,
          `--gutter-l` below it here, `--gutter-l` either side.

          ⚠ **At rest it is the card's gap to the FOOT and stays `--line-hem`
          × 1.5**, which is what the strip has spent between a card and a bar
          since 28 August. The foot is the bottom element then, so this is not
          the page's edge and must not be squared with it.

          ⚠ **It transitions with the band, on the one duration and curve**, or
          the two halves of the same inset arrive at different times.
        */}
        <div
          className={`gutter mx-auto w-full max-w-[var(--record-measure)] transition-[padding-bottom] duration-[var(--recede)] ease-[var(--ease-recede)] ${
            makingRoom ? 'pb-[var(--gutter-l)]' : 'pb-[calc(var(--line-hem)*1.5)]'
          }`}
        >
          {/*
            ⚠⚠ **THE BAND ABOVE THE COMPOSER IS BACK, AND NOTHING LANDS IN IT —
            6 September, directed:** *I want the old sheet back but I don't want
            any receipts to land in it; leave the receipt flow we have now
            intact.* The strip carried this space until 5 September, when *a
            capture stops being a draft and becomes a statement, in place* moved
            the whole moment **inside** the composer and the receipt was deleted.
            **The receipt flow is untouched** — the words still dim, go solid,
            blink twice and offer their undo in the field. Only the space came
            back.

            ⚠⚠ **IT IS ALWAYS THERE, WHICH IS THE DIFFERENCE FROM THE OLD ONE.**
            The strip used to be content-sized, so the band existed only while
            something was in it and **the sheet changed shape between the two
            states** — which is the fault `receipt-line` was written to answer.
            Reserved unconditionally, the sheet is one height, the rail's floor
            is one height, and nothing moves when a capture fails.

            ⚠ **The failure line renders INTO this slot rather than beside it.**
            It is the one thing still allowed above the composer, and two bands
            would be two answers to *what is this space for*. Its `pb` moved onto
            the band, so the box is the same whether the line is there or not.

            ⚠ **`--leading-line` plus `--line-hem × 1.5`, and neither is a new
            number** — one line of the record's own leading, and the gap the
            strip already spends between the card and the foot. **No pixel in
            it**, so it follows the desk's root scale.
          */}
          {/*
            ⚠⚠ **THE BAND CLOSES TO THE COMPOSER'S OWN SIDE GAP WHILE SOMEBODY
            WRITES — 6 September, directed:** *when the keyboard is up the band
            above the composer should reduce in height so it's the same size as
            the padding between the sides of the composer and the edges of the
            phone.* **It is the same token, not the same number** —
            `--gutter-l` is what `gutter` puts on the card's sides, so the gap
            over the composer and the gap beside it cannot drift apart, and
            neither is written here.

            ⚠ **`--gutter-l` rather than an average of the two.** The gutters are
            `max(1.25rem, env(safe-area-inset-*))` and are equal in portrait; in
            landscape a notch makes one side wider, and the band takes the start
            side rather than inventing a third value.

            ⚠ **Keyed on `writing`, not on `--keyboard-overlap`.** The direction
            says *when the keyboard is up*, but that property measures a gap that
            also opens when a Safari tab's address bar collapses during a scroll
            — `useKeyboardHem` says in writing that it is not a keyboard
            detector. This is the same key the dim and the composer's third line
            already use, so the three cannot disagree about what state the screen
            is in.

            ⚠ **It transitions on the app's one duration and curve**, because the
            field's own height already does: the strip's top edge is the rail's
            floor, and two things moving it on different clocks is the fault
            `--recede` was collapsed to one value to avoid.

            ⚠ **A failure line still fits, and that is by the flow rather than by
            the box.** A commit blurs the field, so `writing` is false by the
            time a failure can be shown and the band is at its full height. **If
            a failure is ever raised without ending the writing mode, this height
            has to become a `min`.**
          */}
          <div
            className={`transition-[height] duration-[var(--recede)] ease-[var(--ease-recede)] ${
              makingRoom
                ? 'h-[var(--gutter-l)]'
                : 'h-[var(--tap-floor)]'
            }`}
          >
            {failed !== null && (
              <p className="text-decline px-[calc(var(--line-hem)*2.5)] text-[length:var(--text-line)] leading-[var(--leading-line)]">
                {failed}
              </p>
            )}
          </div>

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
            ground. See `docs/re-direction/inactive/the-front-page.md` §5.
          */}
          <div
            ref={box}
            className={`composer-glow ${makingRoom ? 'composer-glow-tight' : ''} rounded-2xl bg-[var(--glass-tint)] p-[var(--page-lead)] backdrop-blur-[var(--glass-blur)] stack:bg-[var(--color-surface)] stack:backdrop-blur-none`}
          >
          {/*
            ⚠ **A positioning context for the line that lands.** The card cannot
            be it: the card is padded, so `inset: 0` against it would put the
            words a hem out from where the field's own words sit, and the whole
            point is that they do not move on being sent.
          */}
          <div className="relative">
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
            /*
              ⚠ **Silent while a line is landed.** The field is empty and
              underneath the words that were just written, so its placeholder
              showed THROUGH them — two texts in one box, one of them an
              invitation to write while the last capture was still being offered
              back. Emptying the attribute is enough; the field stays mounted and
              stays focusable, which is the rule that matters.
            */
            placeholder={landed === null ? 'Anything' : ''}
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
                ⚠⚠ **THE BOX BUMPS ONLY WHEN NOTHING LANDED.** A trimmed paste
                put words in and can be seen to have done so; a refused keystroke
                put nothing in, changes no state, and is therefore the one case
                with no evidence at all. **That is what needs saying, and it is
                also the only case where this is safe** — a refusal triggers no
                re-render, so the class survives the animation, where after
                `setDraft` React would reconcile it away mid-bump.
              */
              if (kept === draft && box.current) {
                box.current.classList.remove('composer-refused')
                /* Force a reflow so the animation restarts rather than being
                   removed and re-added inside one frame, which does nothing. */
                void box.current.offsetWidth
                box.current.classList.add('composer-refused')
              }
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

              ⚠⚠ **BUT FOCUS MOVING TO A CONTROL IN THE STRIP IS NOT LEAVING,
              AND WITHOUT THAT THE CONTROLS DO NOT WORK AT ALL — found 5
              September, and it is the record's own guard arriving a day late.**
              `page-screen.tsx` has said in writing since 30 August that
              *`relatedTarget` inside the sheet is not leaving*, because the
              chips beside its field take focus on a desk click. This screen was
              written without it and the cost was invisible until the box learnt
              to change height:

              **a click on the undo blurred the field → `writing` went false →
              the composer shrank from three lines to two → the button moved
              ~20px under the pointer between mousedown and mouseup → no click
              event was ever dispatched.** The control was lit, correctly placed,
              hit-tested to itself, and dead.

              ⚠ **It takes the send arrow with it**, which had been failing the
              same way and was written off as a probe artefact. **Any control in
              this strip would have been.**

              ⚠ **iOS never had the bug and still needs the guard.** It does not
              focus a button on tap at all, so the field never blurs there — the
              engines that do are the desk and Android, and a fix that held on
              only one of them is the thing *How things get fixed* rules out.
            */
            onBlur={(e) => {
              const strip = e.currentTarget.closest('.writing-sheet')
              if (
                e.relatedTarget instanceof Node &&
                strip !== null &&
                strip.contains(e.relatedTarget)
              ) {
                return
              }
              setWriting(false)
            }}
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
              ⚠⚠ **TWO LINES AT REST, THREE WHILE IT IS BEING WRITTEN IN —
              directed 5 September: *when a user taps in the composer and the
              keyboard rises, the composer itself should increase in size just
              enough to add one extra line of writing.*** The box therefore has
              exactly **two** heights and moves between them on a gesture.

              ⚠⚠ **THIS IS NOT THE GROWING BOX THAT WAS DELETED, AND THE
              DIFFERENCE IS THE TRIGGER.** That one measured `scrollHeight` and
              grew from two lines to six **as the words arrived** — the card's
              top edge, the glow's box and the strip's height all moving on every
              keystroke past the second line, on the one screen whose promise is
              that writing is instant. This moves **once, when you tap in**, and
              never again while you type. *The box does not follow the words* is
              the rule that survived; *the box has one height* was never the
              point of it. **Do not put a `min-h`/`max-h` pair back** — a range
              is a box that follows its content, which is the thing that went.

              ⚠⚠ **IT STAYS TALL WHILE THERE IS A DRAFT IN IT, AND THAT IS NOT A
              THIRD STATE — IT IS WHAT STOPS THE THIRD LINE BEING HIDDEN.** The
              field is `overflow-y-hidden` and the cap is measured against
              whatever the box currently is, so three lines of draft in a box
              that shrank to two is a line of somebody's words **clipped, with
              nothing saying so**. `writing || draft !== ''` costs no
              measurement and cannot get it wrong: the short box is only ever the
              empty one. ⚠ **Do not "tidy" this to `writing` alone.**

              ⚠ **Keyed on `writing`, NEVER on `--keyboard-overlap`.** The
              direction says *the keyboard rises*, but that property measures a
              gap that also opens when a Safari tab's address bar collapses
              during a scroll — `useKeyboardHem` says in writing that it is not a
              keyboard detector, and reading it as one is a bug this page has
              already shipped once. `writing` is the gesture that asked for the
              keyboard.

              ⚠ **So the desk grows too, and that is deliberate rather than
              overlooked.** There is no keyboard up there, but there is a focused
              composer, and a pointer-type branch would be a device sniff for a
              behaviour that reads correctly on both.

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
            /*
              ⚠ **One property, two values, set by a class that only ever
              appears once.** Two utilities declaring `height` would be resolved
              by their order in the compiled sheet and a class attribute cannot
              state that order — the trap `--bar-gutter` is a token to avoid — so
              the height reads `--composer-lines` and the state sets it.

              ⚠ **It moves on the app's one duration and one curve.** The bars,
              the foot and the strip all travel on `--recede`/`--ease-recede`;
              a box that jumped while everything around it eased would be the
              only thing on the screen that did.
            */
            /*
              ⚠⚠ **`composer-draft` DIMS THE WORDS AND RESERVES THE UNDO'S ROOM
              — directed 5 September.** *Text that has passed is partially dimmed
              while writing, so that when the arrow is tapped it all goes solid.*
              A draft is provisional and reads as provisional; what has landed is
              a statement and is at full strength. **The two states of the same
              words are told apart by weight of ink, and by nothing else.**

              ⚠ **The end padding is the room the undo will need**, because the
              cap measures against this box: without it a capture that fills the
              third line leaves the control nowhere to go but a fourth.
            */
            className={`page-input composer-draft block h-[calc(var(--leading-line)*var(--composer-lines,2))] w-full resize-none overflow-y-hidden text-[length:var(--text-line)] leading-[var(--leading-line)] transition-[height] duration-[var(--recede)] ease-[var(--ease-recede)] ${
              touch && (writing || draft !== '' || landed !== null)
                ? '[--composer-lines:3]'
                : ''
            }`}
          />

          {/*
            ⚠⚠ **WHAT WAS JUST WRITTEN, STILL IN THE BOX — directed 5 September:
            *this all stays inside the composer, never outside.*** The receipt
            above the composer is deleted. A capture does not travel on being
            sent; it stops being a draft and becomes a statement, in place, at
            full strength, and blinks twice to say so.

            ⚠ **`aria-live`, because nothing else announces it.** The words are
            already on screen for a reader who can see them; for one who cannot,
            the field emptying is the only event, and an empty field is not a
            confirmation.

            ⚠ **It is a layer over the field, never a replacement for it.** The
            `<textarea>` is mounted at all times — iOS raises a keyboard only for
            a focus inside the gesture that asked for it — so undo can put the
            words back and focus it in one handler.
          */}
          {landed !== null && (
            <p
              ref={sentLine}
              dir="auto"
              aria-live="polite"
              onAnimationEnd={
                leaving
                  ? () => {
                      setLanded(null)
                      setLeaving(false)
                    }
                  : undefined
              }
              className={`composer-sent ${leaving ? 'composer-sent-leaving' : ''}`}
            >
              {landed}
            </p>
          )}

          {landed !== null && landedId !== null && (
            <span
              ref={sentUndo}
              className="composer-undo line-glyph [--glyph:var(--glyph-line)]"
            >
              <button
                type="button"
                onMouseDown={keepFocus}
                onClick={undo}
                aria-label="Undo the last capture"
                className="text-chrome flex items-center"
              >
                <UndoGlyph />
              </button>
            </span>
          )}
          </div>

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

            ⚠⚠ **IT STAYED FOUR COLUMNS WHEN THE CONSOLE WENT TO FIVE — 5
            September.** The console's row moved because the **tray** moved: its
            settle glyph is aligned to the tray's x centre and that alignment is
            load bearing. **Send is aligned to nothing**, which the note below
            has always said, so there is nothing here for a fifth column to keep
            in step with — and widening it would move the arrow off the edge of
            the box for no reason at all.

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
                  onMouseDown={keepFocus}
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
              onMouseDown={keepFocus}
              onClick={() => (landedId === null ? void commit() : acceptNow())}
              /*
                ⚠ **The pair reads as a pair: *Undo the last capture* against
                *Keep it*.** It said *Write another* while it focused the field;
                it does not focus the field any more, and a control promising a
                keyboard that does not arrive is the button that lies.
              */
              aria-label={landedId === null ? 'Save it' : 'Keep it'}
              /*
                ⚠ **Lit whenever it can act.** While the window is open the field
                is empty, so the draft test would draw the one control that has
                something to do as off.
              */
              disabled={landedId === null && draft.trim() === ''}
              /*
                ⚠⚠ **THE `+` IS THE DRAFT'S OWN INK, NOT THE CHROME — 8
                September, directed:** *make the plus sign, when it appears, the
                same colour as the text that's written before the arrow is
                pressed.* The arrow keeps `--color-chrome`; only the `+` changes.

                ⚠ **It reads as a link between the control and the words it is
                about.** The `+` means *I meant it, let me write the next one* —
                it is the answer to a capture that has just landed, so wearing
                that capture's own ink says which words it is answering. **The
                arrow is a submit and belongs to the chrome; the `+` belongs to
                the line.**

                ⚠⚠ **AND IT IS A DEPARTURE FROM §11's SCARCITY RULE, STATED
                RATHER THAN SLIPPED IN.** `--color-chrome` *means a control,
                never a state*, and this is a control not wearing it. What makes
                it affordable is that `--draft-ink` is not a new pigment — it is
                the app's ink tinted with the composer's own glow, already on
                this screen and already in this box. ⚠ **If a second control ever
                wants it, that is the point at which the rule has actually been
                broken**, not this one.
              */
              className={`tap-target col-start-4 flex items-center justify-self-center transition-colors ${
                landedId === null && draft.trim() === ''
                  ? OFF
                  : landedId === null
                    ? 'text-chrome'
                    : 'draft-lit'
              }`}
            >
              {/*
                ⚠⚠ **A `+` FOR AS LONG AS THE UNDO IS THERE — directed 5
                September.** The two controls are the two answers to the same
                question: the undo says *give it back*, the `+` says *I meant it,
                let me write the next one.* Waiting ten seconds was the only other
                way to say the second, and a countdown is not an answer.

                ⚠⚠ **`SendGlyph`'s OWN NOTE ARGUES AGAINST A `+` HERE AND DOES NOT
                BIND, WHICH IS WORTH SAYING BEFORE SOMEBODY RESTORES IT.** It
                reads: *a `+` in a composer means attach, everywhere it appears,
                so spending it on submit would put two meanings on one drawing in
                the one row that has both.* **That is about submit.** Nothing is
                being submitted in this state — the capture has already landed —
                and `WriteGlyph`'s own note says a plus means *another one*, which
                is exactly what this is. ⚠ **So the arrow keeps submit and must
                not be replaced by a `+` in the ordinary state.**

                ⚠ **They cannot be seen together.** One drawing occupies the slot
                at a time, so there is never a `+` beside an arrow asking which
                one sends.
              */}
              {landedId === null ? <SendGlyph /> : <WriteGlyph />}
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

          ⚠ **The row no longer LEAVES; it CLOSES — 8 September.** This block
          used to say the foot may be unmounted here where on the record it may
          not, because the record's two states share one cell and this page has
          two rows. **That is still true of unmounting and it is no longer what
          happens.** The row stays in the flow and collapses to zero over
          `--recede`, so the end state is what it always was — no reserved 44px
          of glass below the field, which would be the *gap under the
          characters* bug rebuilt — and the way there is a travel rather than a
          step.

          ⚠⚠ **BECAUSE THE HARD SWAP WAS THE JOLT, AND THE PARAGRAPH THAT USED
          TO SIT HERE SAID SO IN ADVANCE:** *it does not fade, and that is a
          known rough edge — `hidden` carries the opacity transition and cannot
          carry a height, so this is a hard swap where everything else on the
          bottom edge moves on `--recede`. **If it reads badly, the fix is a
          collapsing row and not a reserved gap.*** Reported from a handset as
          *the strip jolts — up, then down, then up again* and, with two
          screenshots, from the desk as *the strip drops down when you tap in*.
          **Measured at 1440×900, where there is no keyboard and no pan to
          blame: the strip's top fell 44px in one frame — exactly this row —
          then climbed 31px back over 300ms** as the band, the third line and
          the hem under the card eased in. See `composer-foot` in globals.css.

          ⚠ **`hidden` rather than a fade of our own.** `Foot` has carried that
          prop since the split — `opacity-0` on `--recede` and `--ease-recede`,
          the same duration and curve as the close. Without it the row would
          guillotine a full-opacity drawing from both edges as it shuts.

          ⚠⚠ **`arrived` IS GATED ON `!writing`, AND THAT IS THE GUARANTEE THE
          UNMOUNT USED TO GIVE FOR FREE.** CLAUDE.md: *a capture committed with
          the keyboard up has no door to animate when its window closes, so
          `arrived` survives until the foot is on screen and plays on mount — a
          signal nobody could have seen is not a signal.* A mounted row would
          play the bounce behind `opacity-0` and `onAnimationEnd` would put the
          flag down, so **the bounce would be spent on nobody.** Passing the
          flag only while the row is open restores it exactly: the class goes on
          when writing ends, which restarts the animation the same way a remount
          did.

          ⚠ **`inert` while it is closed.** `hidden` gives
          `pointer-events: none` and `composer-foot` clips the box, which
          between them answer the thumb; neither answers a keyboard user tabbing
          into a row that is not there — and focus landing inside the strip
          would also be read by the field's `onBlur` guard as *not leaving*,
          which is a trap rather than a rough edge.
        */}
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
          {/*
            ⚠⚠ **`foot-clear` IS WHAT MAKES THE BAND AND THE FOOT READ EQUAL
            IN A SAFARI TAB — 7 September, reported from a handset.** The band
            above the card is `--tap-floor`; the air below it is this row's
            hem, its own air around a `--glyph-foot` drawing, and the notch's
            clearance. On a notched handset that came to 43.875 against the
            band's 44 and looked right; **in a tab the inset is zero, so it
            was 25.5** and the band read as nearly twice the foot. See
            `foot-clear` for the derivation and why the air is here rather
            than on the strip's padding.
          */}
          {/*
            ⚠⚠ **THE GUTTER, AND WITHOUT IT THIS ROW WAS THE ONLY FULL-BLEED
            THING ON THE SCREEN — 12 September, reported: *position the glyphs
            on the home screen, the landing page, identically to how they're
            positioned when users are on the recorder page.*** `Foot` is one
            component with one set of classes on both screens, so the difference
            could only ever have been its container — and it was: the record's
            footer sits inside `gutter mx-auto w-full
            max-w-[var(--record-measure)]`, the same wrapper the composer puts
            round its own card six hundred lines up, and this row had nothing.

            ⚠ **Measured at 390×844, `node_modules/.probe/footparity.mjs`:** the
            footer ran **0→390 against the record's 20→370**, so its five columns
            were 78px where the record's are 70 and the outer glyphs sat
            **20px** further out — the home glyph on the screen's edge while the
            card above it was held off by `--gutter-l`. After: both 20→370, both
            70px columns, every centre equal to the pixel.

            ⚠ **The same three classes as the card above, not a `px-` of its
            own.** `--gutter-l` is what holds every other box on this screen off
            the edge; a second spelling of it here is a number to keep in step.

            ⚠ **The VERTICAL was already right where it matters and is
            deliberately not touched.** At inset 0 this row sits 19.38px higher
            than the record's, and all of it is `foot-clear`'s
            `margin-block-end` — which is `max(0px, … − --sheet-clearance)`, so
            **on a notched handset it is spent and the two rows land 1px apart.**
            Measured at `INSET=34`. That margin is what tops the air under the
            row up to the band above the card (8 September, `bandink.mjs`), and
            the record has no band to answer to.
          */}
          <div
            className={`max-stack:foot-clear composer-foot gutter mx-auto flex w-full max-w-[var(--record-measure)] items-center ${
              makingRoom ? 'composer-foot-away' : ''
            }`}
            inert={makingRoom}
          >
            <Foot
              hidden={makingRoom}
              home="here"
              record="away"
              arrived={arrived && !makingRoom}
              onArrived={() => setArrived(false)}
              searchable={searchable}
              portal={() => router.push('/record?portal=1')}
              portalWaiting={portalWaiting}
            />
          </div>
      </div>
    </div>
  )
}
