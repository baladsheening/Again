'use client'

import { useEffect, useRef, useState } from 'react'

import { searchAction } from '@/app/actions/captures'
import { PageLines } from './page-lines'
import type { PageLineView } from '@/lib/page-line'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Search: *where is that thing I wrote in June*
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **A surface of its own, and it has to be.** The page's list is live captures;
 * the tray's is settled ones; a search that only saw one of them would miss the
 * case it exists for, because a line you are trying to find again is usually one
 * you already dealt with. So it reads across everything the person wrote — and
 * that union is not a filter over any list already on screen.
 *
 * ⚠ **Not per-line.** The foot's other tools act on the picked line; this one
 * does not act on anything. It is a way back into the record, which is why it is
 * lit whenever there is a record and dark when there is not.
 *
 * ⚠ **The results are the record's own rows, and nothing here can change one.**
 * No pick, no ×, no settle: a result is a line seen from somewhere else, and a
 * surface that could act on it would need the foot, the undo window and the
 * whole state machine of the page carried into a second place. Reading is the
 * whole promise. What a found line *does* next is a decision this surface does
 * not have to make to be useful.
 *
 * ⚠ **Typed, not submitted.** There is no Return to press and no button to
 * find: the answer follows the words. Return does nothing at all here — which is
 * deliberate, because on the *other* page Return commits a capture, and a key
 * that means two things across two screens is how somebody files a search query
 * as a want.
 */

/**
 * How long the field waits after the last keystroke.
 *
 * ⚠ **A debounce, not a throttle, and it is a network decision rather than a
 * feel one.** Every keystroke is a query against the whole of somebody's
 * record; firing per character makes the first six letters of a word six scans,
 * five of which are already stale. 200ms is under the threshold where a wait is
 * noticed and over the interval between keystrokes of ordinary typing.
 */
const SETTLE_MS = 200

/**
 * An answer, **and the question it answers.**
 *
 * ⚠ **The words are held with the lines rather than beside them**, so a list can
 * never be shown under a query it does not belong to. The alternative is a
 * `useEffect` that clears the results whenever the field changes — which is a
 * second writer racing the one that fills them, and it is what this file did
 * first. Comparing is free; clearing has to be timed.
 */
type Answer = { q: string; lines: PageLineView[]; earlier: string | null }

export function SearchScreen() {
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [reading, setReading] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  /**
   * ⚠ **The last query wins, and it is decided by a token rather than by
   * arrival.** Server Actions are not guaranteed to answer in the order they
   * were called, so a fast answer to *pot* can land after a slow one to *pott*
   * and leave the field and the list disagreeing. Every run takes a ticket and
   * a stale ticket writes nothing.
   */
  const run = useRef(0)

  useEffect(() => {
    const needle = q.trim()
    if (needle === '') return

    const ticket = ++run.current
    /*
      ⚠ **Nothing is set in the body of this effect**, which is why the empty
      case simply returns rather than clearing anything: what is displayed is
      derived from `answer.q` against the field below. Every write here happens
      inside the timer, after the debounce, where it is a consequence of an
      answer rather than of a keystroke.
    */
    const timer = setTimeout(async () => {
      setReading(true)
      setFailed(null)
      const result = await searchAction({ q: needle, cursor: null })
      if (run.current !== ticket) return
      setReading(false)
      if (!result.ok) {
        setFailed(result.message)
        return
      }
      setAnswer({ q: needle, lines: result.value.lines, earlier: result.value.earlier })
    }, SETTLE_MS)

    return () => clearTimeout(timer)
  }, [q])

  /** More of the same answer, appended — the page's *Earlier*, on this list. */
  async function readEarlier() {
    if (answer === null || answer.earlier === null || reading) return
    const ticket = run.current
    const asked = answer.q
    setReading(true)
    const result = await searchAction({ q: asked, cursor: answer.earlier })
    if (run.current !== ticket) return
    setReading(false)
    if (!result.ok) {
      setFailed(result.message)
      return
    }
    setAnswer((prev) =>
      prev === null || prev.q !== asked
        ? prev
        : {
            q: asked,
            lines: [...prev.lines, ...result.value.lines],
            earlier: result.value.earlier,
          },
    )
  }

  const needle = q.trim()
  /** The answer to what is in the field *now*, or nothing to show. */
  const showing = answer !== null && answer.q === needle ? answer : null
  const lines = showing?.lines ?? []

  return (
    <>
      {/*
        ⚠ **Visible, and set exactly as the tray sets its own.** Both are
        destinations reached from a glyph, and a glyph is not a name: arriving
        somewhere with a caret in a field and no word for where you are is how a
        search field gets typed into as though it were the capture line. The tray
        already answered this question; this is the same answer.
      */}
      <h1 className="stamp text-muted mb-2.5">Search</h1>

      {/*
        ⚠ **The same box as a line of the record**, because the answer under it
        is lines of the record: `page-line` is the geometry and `page-input`
        strips the browser's own chrome, exactly as the capture field uses them.
        A form-shaped box here would make the one place you read your own words
        back the one place they are not set as your words.
      */}
      <input
        /*
          ⚠ **`text`, not `search`, and the widget is why.** `type="search"`
          paints the engine's own clear button inside the field — a bright blue
          × on a matte black page, which is the browser talking in a palette
          §11 does not have. It was measured on screen. Hiding it with
          `::-webkit-search-cancel-button` would be correcting for one engine's
          decoration on every engine; removing the type removes it outright, and
          nothing else about `search` was being used. `role` keeps the meaning
          the type carried, and `inputMode` and `enterKeyHint` were never the
          type's to give.
        */
        type="text"
        role="searchbox"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          /*
            ⚠ **Return does nothing, and that is a guard rather than an
            omission.** The answer already follows the words. On the capture page
            Return commits a line, and a key that means two things across two
            screens is how somebody files a search query as a want.
          */
          if (e.key === 'Enter') e.preventDefault()
        }}
        autoFocus
        enterKeyHint="search"
        inputMode="search"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="Search your record"
        className="page-line page-input caret-chrome"
      />

      {/*
        ⚠ **Nothing is said before somebody types**, for the reason the empty page
        says nothing: the caret is the instruction. A *nothing captured yet* line
        was written here first and removed with the read that fed it — a person
        with an empty record types, and *Nothing.* is the true answer, arrived at
        by the same path as every other answer. One state fewer, one query fewer,
        and no way for the two to disagree.

        What *is* said is the one thing a caret cannot: that a search found
        nothing, which is an answer and not an absence of one.
      */}
      {failed !== null && <p className="page-line">{failed}</p>}

      {failed === null && !reading && showing !== null && lines.length === 0 && (
        <p className="page-line text-muted">Nothing.</p>
      )}

      {/*
        ⚠⚠ **THE ROWS ARE `PageLines` SINCE 12 SEPTEMBER, AND THE FRONT PAGE
        DRAWS THE SAME COMPONENT.** They were written here first; home showing
        the record under its composer gave them a second caller, and a second
        copy would have been design rule 3 broken by construction — *one object
        has one height wherever it appears*.

        ⚠ **The lead is the caller's, which is why it is a class here.** Under a
        search field the list wants `mt-6`; under the bar the front page already
        has `--page-lead`. ⚠ **And it is gated on there being lines** — a margin
        on an empty `<ol>` still takes its 24px, under *Nothing.*
      */}
      {lines.length > 0 && <PageLines lines={lines} className="mt-6" />}

      {/* The record continues, here as on the page. See `readEarlier` there. */}
      {showing?.earlier != null && (
        <button
          type="button"
          onClick={readEarlier}
          disabled={reading}
          className="stamp text-muted hover:text-text flex min-h-[var(--tap-floor)] items-center self-start transition-colors"
        >
          Earlier
        </button>
      )}
    </>
  )
}
