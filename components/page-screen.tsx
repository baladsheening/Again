'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  captureAction,
  crossOffCaptureAction,
  settleCaptureAction,
  undoCaptureAction,
} from '@/app/actions/captures'
import type { EntryState } from '@/lib/domain'
import { mutationId as newMutationId } from '@/lib/mutation-id'
import { Bar } from './bar'
import { Foot } from './foot'
import { useKeyboardPin } from './keyboard-pin'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The page is the app
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The landing screen is a blank page you type down.** Not a capture field
 * pinned above a list — the page itself is the record, empty on first run and
 * filling as you write. One line is one capture; Return commits the line and
 * drops to a fresh one, so a run of captures is a run of Returns and nothing
 * else.
 *
 * **The newest line is the first one.** The caret sits under the bar and every
 * capture pushes the record down, so what you just wrote is on screen without a
 * scroll, and the line most likely to be settled is the one nearest the thumb.
 *
 * ⚠ **This reverses the written order the page shipped with**, and the metaphor
 * it cost is real: you no longer type down a page the way you write in a
 * notebook. It was traded for the two things a handset made obvious — arriving
 * on the newest line without a scroll to the end of the record, and a caret the
 * keyboard can never cover, because it is above the fold by construction.
 *
 * ⚠ **Nothing in the app can cause an open.** No feed, no notification, no
 * streak. Every open is caused by something in the world — a shelf, a poster, a
 * sentence at a party — so the whole design answers one requirement: **open,
 * typed into, and closed in under five seconds, one-handed.** Until convergence
 * exists in Phase 2 the app has to win on capture speed alone, which sets the
 * bar precisely: if typing into Again is not faster than typing into Notes,
 * there is no reason to use it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The page is not a text buffer, and that is the load-bearing decision
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Only the bottom line is live.** Every line above it is a *record*, not an
 * input — which is already true and was being pretended otherwise: a committed
 * line can be struck through or carry a year, and neither of those is text.
 *
 * Once that is admitted the collision disappears:
 *
 *   - **Tap the words and the line is picked.** One meaning, no modifier, no
 *     hidden gesture.
 *   - **Tap the paper and you are writing.** The words are the record; the rest
 *     of every row is the page. A line's hit area is the width of its own text,
 *     so a short capture hands the whole right-hand side of its row back.
 *   - **The keyboard follows liveness.** Gone the moment a saved line is picked.
 *
 * ⚠ **A line that wraps to the full measure leaves no paper**, and that is
 * accepted rather than corrected. The alternative is `display: inline` on a
 * button, so that hit-testing follows the text fragments rather than one box —
 * which renders differently on every engine, and a workaround written for one
 * engine still executes on all of them. Captures are short; a screen on which no
 * row has paper is not a screen this record produces.
 *
 * ⚠ Without this, tapping a line to settle it would place a caret and start an
 * edit instead. The fix is not a modifier gesture on an always-editable page; it
 * is removing the premise that every line is a live input.
 *
 * ⚠ **A second tap does not yet edit.** The design says it should, and where
 * that edit happens — in place or in a detail view — is the one thing that
 * document leaves open. So the second tap holds the pick rather than teaching a
 * gesture that has to be taken back: unpicking is a tap on the page, which is
 * also how you get back to writing, which is the thing you were going to do
 * next anyway.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The client owns the list, and the server is the seed
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Return does not wait for the network and does not `refresh()`.** The line
 * lands in the list, the caret drops to a fresh one, and the save goes out
 * behind it. A router refresh per Return would put a server round trip between
 * somebody and their next word — and then tell the page its own list a second
 * time, which is a flicker on a screen whose whole promise is that it behaves
 * like paper.
 *
 * So this component owns the page for the length of the session and reads the
 * server again on the next load. There is exactly one list on screen and no
 * reconciliation, which is also why every mutation here is optimistic and
 * reverts on a failure rather than waiting on one.
 */

/** One line, as the server hands it over. */
export type PageLineView = {
  id: string
  text: string
  state: EntryState
  year: number | null
  /** Stamped on the server — see `lib/day.ts` for why the client never formats. */
  day: string
  dayLabel: string
}

/**
 * One line, as the page holds it.
 *
 * `key` is stable from the moment a line exists, which for a line typed here is
 * before it has an `id`. React needs one that does not change when the server's
 * answer arrives, or the row it is keyed by unmounts and remounts under the
 * finger that made it — and on an optimistic list that is every line.
 */
type Line = PageLineView & {
  key: string
  /** Held for the length of the line, so a retry is the *same* submission. */
  mutationId?: string
  pending?: boolean
  /** What went wrong, on the line it went wrong on. */
  failed?: string | null
}

export function PageScreen({
  lines: seed,
  todayKey,
  undoWindowMs,
}: {
  lines: PageLineView[]
  /**
   * The group a line typed now belongs to, decided by the server so that it is
   * the same group the server already put today's other lines in.
   */
  todayKey: string
  /**
   * ⚠ **The window, passed down rather than imported.** It is
   * `UNDO_WINDOW_MS` in `lib/db/captures.ts`, which is `server-only` and cannot
   * be reached from here — and the alternative, a second `10_000` written in a
   * client file, is a number that goes stale silently the day the real one
   * moves. The server bounds the delete in SQL either way; this only decides how
   * long the glyph is lit.
   */
  undoWindowMs: number
}) {
  const [lines, setLines] = useState<Line[]>(() =>
    seed.map((l) => ({ ...l, key: l.id })),
  )
  const [draft, setDraft] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  /** The line whose *Again?* is standing open. */
  const [asking, setAsking] = useState<string | null>(null)
  /** The last line to land, while the ten seconds hold. */
  const [undoable, setUndoable] = useState<string | null>(null)

  const input = useRef<HTMLInputElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLElement>(null)
  const footAnchor = useRef<HTMLDivElement>(null)
  const floorAnchor = useRef<HTMLDivElement>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useKeyboardPin({ focused, foot, footAnchor, host, floorAnchor })

  const pickedLine = lines.find((l) => l.id === picked) ?? null

  /*
    The top of the page, instantly — which is where the caret is.

    ⚠ **`behavior: 'instant'` because `html` carries `scroll-behavior: smooth`**
    (§10/§11 — respected throughout), and an animated scroll is the app taking a
    second to show somebody where they have just asked to be.

    ⚠ **Nothing scrolls on arrival any more, and nothing scrolls after a Return.**
    The caret is the first thing in the document, so the top of the page is where
    the browser already opens. A `useLayoutEffect` used to run a scroll-to-end
    before paint, so a record with three months in it did not open on March; it
    went with the written order that put March first in the document. **A
    subtraction cannot be wrong on a device nobody has tested.**

    What is left is the one case that still needs a scroll: a tap on the paper
    while the record is scrolled away from the caret. Focus alone would leave the
    choice to the browser, and with a fixed bar overhead its choice can be a
    caret sitting underneath it.
  */
  const toCaret = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  /*
    ⚠ **The live line is one row and stays one row.** A growing textarea used to
    be here — `scrollHeight` written back as a height, because `field-sizing:
    content` is not in Safari — and it is gone with the element that needed it.
    An `<input>` keeps the caret in view by scrolling its own text, so a capture
    longer than the row pushes back through it rather than growing the row and
    shoving the record down the page while somebody is still typing.

    That is a mechanism removed rather than corrected: no measurement, no
    `el.style` write, no CSP note about attribute parsing, and no Safari
    feature to wait for.
  */

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
  }, [])

  /** The ten seconds, as a colour on one glyph. The server owns the real bound. */
  const openUndo = useCallback(
    (id: string) => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
      setUndoable(id)
      undoTimer.current = setTimeout(() => setUndoable(null), undoWindowMs)
    },
    [undoWindowMs],
  )

  const closeUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndoable(null)
  }, [])

  /**
   * Put a message on the line it belongs to, and take it off the rest.
   *
   * Every write here is a functional update, so a stale closure over this cannot
   * be wrong — it never reads the list it is changing.
   */
  const mark = useCallback(
    (key: string, patch: Partial<Line>) =>
      setLines((all) => all.map((l) => (l.key === key ? { ...l, ...patch } : l))),
    [],
  )

  /* ------------------------------------------------------------------ */
  /*  Return                                                            */
  /* ------------------------------------------------------------------ */

  const send = useCallback(
    async (key: string, text: string, mutationId: string) => {
      const result = await captureAction({ text, clientMutationId: mutationId })
      if (!result.ok) {
        mark(key, { pending: false, failed: result.message })
        return
      }
      mark(key, { id: result.value.id, pending: false, failed: null })
      /*
        Only a real creation opens the window. A retry that found the submission
        already written returns the row that was there, and offering to delete
        something that landed a minute ago because the connection came back is
        the opposite of what undo is for.
      */
      if (result.value.created) openUndo(result.value.id)
    },
    [mark, openUndo],
  )

  function commit() {
    const text = draft.trim()
    if (text === '') return

    /*
      ⚠ **One id, minted here, held with the line.** It is what makes a
      double-tapped Return or a resumed connection one capture rather than two —
      raw text is never deduplicated, because the same words can mean a
      different thing on a different day, so there is no unique key standing
      behind this the way there is behind a resolved film.
    */
    const mutationId = newMutationId()
    const line: Line = {
      key: mutationId,
      /* No server id yet. The line is on the page regardless; that is the point. */
      id: '',
      text,
      state: 'want',
      year: null,
      day: todayKey,
      dayLabel: 'Today',
      mutationId,
      pending: true,
      failed: null,
    }

    /* The head of the list, because the head of the list is under the caret. */
    setLines((all) => [line, ...all])
    setDraft('')
    setPicked(null)
    setAsking(null)
    closeUndo()

    /* Not in a transition: the list is already right, and this is the receipt. */
    void send(line.key, text, mutationId)
  }

  /** The same submission again, with the same id — so a retry cannot double. */
  function retry(line: Line) {
    if (!line.mutationId) return
    mark(line.key, { pending: true, failed: null })
    void send(line.key, line.text, line.mutationId)
  }

  /* ------------------------------------------------------------------ */
  /*  The foot's two live controls                                      */
  /* ------------------------------------------------------------------ */

  function crossOff(line: Line) {
    const crossedOff = line.state === 'dropped'
    const next: EntryState = crossedOff ? 'want' : 'dropped'
    mark(line.key, { state: next, failed: null })
    setAsking(null)

    void crossOffCaptureAction(line.id, !crossedOff).then((result) => {
      if (!result.ok) mark(line.key, { state: line.state, failed: result.message })
    })
  }

  function settle(line: Line, again: boolean) {
    setAsking(null)
    setPicked(null)
    /* It leaves the page for the tray, so it leaves the list. */
    const at = lines.findIndex((l) => l.key === line.key)
    setLines((all) => all.filter((l) => l.key !== line.key))

    void settleCaptureAction(line.id, again).then((result) => {
      if (result.ok) return
      /*
        Back **where it was**, by the index it held rather than by re-sorting.
        The page is in written order, and two lines saved in the same
        millisecond have no order to sort them back into — so the position is
        remembered rather than recomputed.
      */
      setLines((all) => [
        ...all.slice(0, at),
        { ...line, failed: result.message },
        ...all.slice(at),
      ])
    })
  }

  function undo() {
    const line = lines.find((l) => l.id === undoable)
    if (!line) return
    closeUndo()
    setLines((all) => all.filter((l) => l.key !== line.key))

    void undoCaptureAction(line.id).then((result) => {
      /*
        ⚠ **A refusal puts the line back, and it has to.** `undoCapture` bounds
        the delete in SQL against `created_at` rather than trusting the client's
        word for how long ago the line landed — so the clock here and the clock
        there can disagree, and the honest answer to "too late" is the line
        still being on the page.
      */
      if (!result.ok) {
        /* Where it was: the newest line is the only one undo can reach. */
        setLines((all) => [{ ...line, failed: result.message }, ...all])
      }
    })
  }

  /* ------------------------------------------------------------------ */

  function write() {
    setPicked(null)
    setAsking(null)
    /*
      ⚠ **The scroll goes first, and the order is the whole point.** The tap may
      have landed anywhere in the record, and focusing an input that is off
      screen hands the scrolling to the browser — which on iOS happens again when
      the keyboard comes up, and with a fixed bar overhead either pass can leave
      the caret underneath it. Arriving at the caret first leaves nothing to
      scroll into view, which removes the race rather than timing against it.
    */
    toCaret()
    input.current?.focus()
  }

  function pick(line: Line) {
    if (line.pending) return
    if (line.failed) {
      retry(line)
      return
    }
    setPicked(line.id)
    setAsking(null)
    /* The keyboard follows liveness: gone the moment a saved line is picked. */
    input.current?.blur()
  }

  const empty = lines.length === 0

  /**
   * ───────────────────────────────────────────────────────────────────────────
   *  ⚠ While the line is empty, the caret is **drawn** rather than the field's
   * ───────────────────────────────────────────────────────────────────────────
   *
   * *A caret on an empty page is already the instruction* — it is the whole of
   * what the first-run screen says, and there is nothing else on it. So it
   * cannot be left to depend on focus, which is the one thing this app does not
   * control: **iOS will not raise a keyboard without a gesture**, `autoFocus`
   * therefore does not do there what it does on the desk, and whether a focused
   * field with no keyboard paints a caret at all is a platform behaviour rather
   * than a promise.
   *
   * Drawing it removes the question instead of answering it. While the draft is
   * empty this span **is** the caret — brass, blinking on `--animate-caret`,
   * exactly where the field's own would sit — and the field's is suppressed with
   * `caret-transparent` so the two can never both appear. The moment a character
   * is typed the real one takes over, because from there on it has to track a
   * position only the browser knows.
   *
   * ⚠ **No focus test and no platform test**, which is the point: one rule, the
   * same on four surfaces, right before anyone has touched the screen.
   *
   * Nothing is drawn while a saved line is picked. That is the browsing state,
   * and the design's own word for it is *no caret anywhere*.
   */
  const drawnCaret = draft === '' && picked === null

  return (
    <div ref={host}>
      <Bar undo={{ live: undoable !== null, onUndo: undo }} />

      {/*
        The floor of the layout viewport, as a thing that can be measured — see
        `useKeyboardPin`. Zero height, no paint, no hit area: it exists to be
        read.
      */}
      <div
        ref={floorAnchor}
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 h-0"
      />
      {/* The foot's resting position, untransformed. Same reason. */}
      <div
        ref={footAnchor}
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 h-0"
      />

      {/*
        ⚠ **The page box is the screen, and `svh` is not the screen.**
        `100svh` in an installed app is the screen *less* the status-bar band —
        `viewport-fit=cover` lets the page paint into that band, but the viewport
        unit does not grow to match it. Measured at 47px on this handset. So a
        page with two lines on it ends 47px above the glass, and whatever iOS
        then does with `position: fixed` puts the foot on *that* line rather than
        on the screen's. Adding the inset back states the one thing that is
        actually true, and it is a no-op in a Safari tab, on Android and on the
        desk, where the inset reads 0.

        **The minimum is what makes the tail of the page reach the bottom.** The
        page is in the document flow, so there is no fixed box for a flex child
        to fill; `grow` inside a minimum tall enough to reach the glass is what
        keeps the end of a short record tappable.

        ⚠ **The tail is no longer the only way to start writing**, so it is not
        given a minimum of its own. The paper on every row is the general case; a
        guaranteed band at the end of the document would be a second mechanism
        doing the first one's job, and it would sit at the far end of the record
        from the caret, which is now at the top.
      */}
      <main
        className="gutter page-hem mx-auto flex min-h-[calc(100svh_+_env(safe-area-inset-top))] w-full max-w-[var(--page-measure)] flex-col pt-[calc(var(--bar-height)+1.25rem)]"
      >
        <h1 className="sr-only">Again</h1>

        {/* --- the live line ------------------------------------------- */}
        {/*
          ⚠ **The band is the one row on the page that is not a record**, and
          after the record went newest-first it needed saying: the draft sits
          directly above a committed line of identical size, face and colour, and
          a half-written line tapped away from looks exactly like something that
          landed.

          ⚠ **It is a glow and not a fill, and it lights only when the line is
          live.** Two flat grounds shipped on 23 August and both came back "too
          grey" — the value was never it; a uniform tone inside a rectangle with
          edges is what reads as grey, whatever the value. `live-band` in
          globals.css carries the whole argument, including why glass cannot work
          on a true black page.

          `data-live` is focus **or** a draft. Focus alone would take the light
          away at the moment it is most needed — a half-written line tapped away
          from is the exact case this exists for — and a draft alone would leave
          an empty focused row unlit while somebody waits to type into it.
        */}
        <div className="live-band" data-live={focused || draft !== '' ? '' : undefined}>
          <div className="relative">
            <input
              ref={input}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => {
                setFocused(true)
                setPicked(null)
                setAsking(null)
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                /*
                  ⚠ **Return commits and never inserts a newline.** One line is one
                  capture: a capture with a line break in it is two things somebody
                  meant to say separately, and the matching path would treat the
                  pair as one string forever after. `isComposing` is the exception
                  that has to be honoured — the Return that closes an IME candidate
                  window is not this Return.
                */
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  /*
                    ⚠ **Nothing scrolls after this.** The caret is the first thing
                    in the document and the new line lands below it, so the page
                    grows downward under a thumb that is already in the right
                    place. A `requestAnimationFrame` scroll-to-end used to be here,
                    and it went with the written order.
                  */
                  commit()
                }
              }}
              /*
                `autoFocus` is the keyboard being up on a cold open, which is why
                the app was opened. ⚠ **iOS will not honour it** — focus without a
                gesture cannot raise a keyboard there, and no arrangement of this
                code changes that. What answers it instead is the paper: **the
                words are the only thing on the page that is not a place to start
                writing**, so the gesture iOS insists on is the one somebody was
                going to make anyway, and it lands wherever the thumb already is.
              */
              autoFocus
              enterKeyHint="enter"
              inputMode="text"
              autoCapitalize="sentences"
              autoCorrect="on"
              autoComplete="off"
              spellCheck
              /*
                Named for a screen reader and **not placeheld on screen**: a word
                sitting in the field would be the app talking over the one gesture
                it wants, and the caret is already the instruction.
              */
              aria-label="Capture"
              className={`page-line page-input ${
                drawnCaret ? 'caret-transparent' : 'caret-chrome'
              }`}
            />

            {drawnCaret && (
              <span
                aria-hidden
                className="animate-caret bg-chrome pointer-events-none absolute top-1/2 left-0 h-[var(--caret-height)] w-[var(--caret-width)] -translate-y-1/2"
              />
            )}
          </div>
        </div>

        {/*
          ⚠ **The air under the band is deliberate and is not the stamp’s.** The
          first day stamp carries no top margin — it is the head of the list — so
          without this the date sat right under a blinking caret and the two read
          as one thing.
        */}
        <ol className="mt-8 flex flex-col">
          {lines.map((line, i) => {
            const stamped = i === 0 || lines[i - 1].day !== line.day
            const crossedOff = line.state === 'dropped'
            const isPicked = line.id !== '' && line.id === picked

            return (
              <li key={line.key}>
                {stamped && (
                  /*
                    The day, in mono, quiet. It asks nothing of anybody, it uses a
                    column the record already has, and it makes two hundred lines
                    navigable by *roughly when* rather than by scrolling.
                  */
                  <p
                    className={`stamp text-muted mb-2.5 ${i === 0 ? '' : 'mt-[26px]'}`}
                  >
                    {line.dayLabel}
                  </p>
                )}

                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => pick(line)}
                    aria-current={isPicked ? 'true' : undefined}
                    /*
                      ⚠ **A line in flight looks exactly like a line that landed,
                      and that is the contract rather than an oversight.** It was
                      dimmed to `opacity-40` for one pass, and measured: Server
                      Actions queue per client, so a run of Returns leaves the last
                      several in flight for a second or two — which showed as the
                      app going pale under somebody who was still typing, doubting
                      lines it had already promised were captured.

                      The page's promise is that the line is on the page. What is
                      worth saying is a **failure**, which the message below says on
                      the line it happened to; anything short of that is the app
                      narrating its own network.
                    */
                    className={`page-line min-w-0 text-start ${
                      isPicked ? 'picked' : ''
                    } ${crossedOff ? 'line-through opacity-50' : ''}`}
                  >
                    {line.text}
                    {/*
                      ⚠ **`leading-none`, and it is the difference between 44px and
                      46px.** A 13px span inheriting the line's 28px line-height
                      gets its own half-leading — (28 − 15.6)/2 against the 18px
                      strut's (28 − 21.6)/2 — so its inline box hangs ~2px below
                      the strut and grows the line box under it. **One line is one
                      line**, whether or not it resolved to something, so the
                      year's box is made smaller than the strut rather than left to
                      push it about.
                    */}
                    {line.year !== null && (
                      <span className="text-muted ms-2 text-[0.8125rem] leading-none">
                        {line.year}
                      </span>
                    )}
                  </button>

                  {/*
                    **The paper of the row: whatever width the words did not
                    use.** The line above shrinks to its own text, so on a short
                    capture this is most of the row — and tapping it starts
                    writing rather than picking the line it sits beside.

                    ⚠ **`aria-hidden` and out of the tab order, deliberately.**
                    It is a pointer convenience for a rule the pointer can see
                    and the accessibility tree cannot: two hundred lines would
                    announce "Write" two hundred times. The reachable, announced
                    way to start writing is the one button at the tail of the
                    page, which is why that one is kept whatever else changes.

                    ⚠ It shrinks to nothing when the words take the full
                    measure, and that is the stated cost of the paper rule — see
                    the head of this file. No minimum is given to it: a minimum
                    would push the words off their own line.
                  */}
                  <button
                    type="button"
                    onClick={write}
                    aria-hidden
                    tabIndex={-1}
                    className="grow cursor-text"
                  />
                </div>

                {/*
                  Full strength, at body size. There is no error colour in the
                  palette — §11 spends red on "you are here" and on a live
                  marker, and a third red would make both of those an alarm — so
                  weight and size carry it instead.
                */}
                {line.failed && (
                  <p className="pb-2">
                    {line.failed} <span className="text-muted">Tap the line to try again.</span>
                  </p>
                )}

                {asking === line.id && (
                  /*
                    ⚠ **One question, and the word is *Again?*** The two outcomes
                    are genuinely different claims — *I would do this again*
                    against *that is dealt with* — and nothing about a raw
                    capture can supply the answer. The word generalises where the
                    film-first *Go back?* did not, and it is the app's own name.

                    `gap-5` on a coarse pointer because Yes and No both carry a
                    44px hit area and at `gap-4` the two expansions meet in the
                    middle.
                  */
                  <div className="flex flex-wrap items-center gap-4 pb-3 pointer-coarse:gap-5">
                    <span className="text-sm">Again?</span>
                    <button
                      type="button"
                      onClick={() => settle(line, true)}
                      className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => settle(line, false)}
                      className="text-muted hover:text-text tap-target text-sm transition-colors"
                    >
                      No
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        {/*
          The tail of the page, and it is a control.

          On a phone the only way to raise a keyboard is a gesture, and the
          gesture nobody has to be taught is *tap the page*. It is a real button
          with a real name rather than a click handler on a div, so it is
          reachable and announced rather than being a trap for anyone not using a
          finger — and it is the **only** one of the page's write targets that
          is. That is deliberate: the paper on each row is hidden from the
          accessibility tree, because a record of two hundred lines announcing
          "Write" two hundred times is worse than announcing it once, here.

          It fills whatever the page's minimum leaves — see the note on `main`.
        */}
        <button type="button" onClick={write} aria-label="Write" className="w-full grow cursor-text" />
      </main>

      <Foot
        footRef={foot}
        crossOff={
          pickedLine
            ? {
                crossedOff: pickedLine.state === 'dropped',
                act: () => crossOff(pickedLine),
              }
            : null
        }
        /*
          A crossed-off line cannot be settled: `resolveCapture` guards on
          `want`, which makes the settleable set exactly the resolvable one, and
          the way back is the × that put it there.
        */
        settle={
          pickedLine && pickedLine.state === 'want'
            ? () => setAsking((open) => (open === pickedLine.id ? null : pickedLine.id))
            : null
        }
      />

      {/*
        Nothing is said about an empty page, deliberately. The caret is the
        instruction, and a line of prose explaining that this is where you type
        would be the app talking over the one gesture it wants.
      */}
      {empty && <span className="sr-only">Nothing captured yet.</span>}
    </div>
  )
}
