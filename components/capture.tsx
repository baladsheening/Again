'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { Poster } from './poster'

/**
 * The home screen: one input box, and what happens after you use it.
 *
 * §8 describes this as the input with the live list directly beneath, and until
 * 9 August it was — because `/` *was* Wants. Wants is its own route now, and the
 * capture box came here rather than staying with the list. What that costs is
 * §8's "never blank underneath", which was written when there was nowhere else
 * for the list to be; see docs/decisions.md.
 *
 * The other §8 requirement is untouched and is the load-bearing one: **it
 * resolves as you type**. Free text that never resolves to a canonical entity
 * silently kills overlap, and the failure is invisible for months.
 */

const DEBOUNCE_MS = 220
const UNDO_WINDOW_MS = 10_000

export function Capture() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FilmSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [chosen, setChosen] = useState<FilmSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ entryId: string; title: string } | null>(null)
  /*
    What replaced the optimistic row.

    Adding used to show up instantly as a row in the list underneath, which was
    the feedback — `useOptimistic` over the entries, reverting on its own if the
    action failed. With the list on another route there is no row to insert, so
    the acknowledgement has to be a sentence instead, and it has to appear on the
    same tick the film is picked rather than when the server answers. Set
    synchronously here, cleared when the transition resolves either way.
  */
  const [adding, setAdding] = useState<string | null>(null)

  // `isPending` is deliberately not destructured. It existed to fade the
  // optimistic row while it was in flight; `adding` above is the acknowledgement
  // now, and it is set and cleared by this component rather than inferred.
  const [, startTransition] = useTransition()

  const inputRef = useRef<HTMLInputElement>(null)

  /* --- resolve as you type ------------------------------------------------ */

  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed.length < 2) return

    const controller = new AbortController()

    // Everything that sets state happens inside the timeout, not in the effect
    // body — a synchronous setState here would cascade a render per keystroke.
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          setResults([])
          setError(res.status === 429 ? 'Slow down a moment.' : null)
          return
        }
        const body = (await res.json()) as { results: FilmSearchResult[] }
        setResults(body.results)
        setError(null)
      } catch {
        // Aborted by the next keystroke — the expected path, not a failure.
      } finally {
        setSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [trimmed])

  // Derived rather than cleared in the effect. Below two characters there is
  // nothing to show, and that is a fact about `query`, not state of its own.
  const visibleResults = trimmed.length >= 2 ? results : []

  /* --- the undo window (§5.1) --------------------------------------------- */

  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => setUndo(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [undo])

  /* --- adding ------------------------------------------------------------- */

  function add(film: FilmSearchResult, intent: Intent) {
    setChosen(null)
    setQuery('')
    setResults([])
    setError(null)
    setUndo(null)
    // Before the transition, not inside it: this is the acknowledgement, and an
    // acknowledgement that waits for the network is not one.
    setAdding(film.title)

    startTransition(async () => {
      const result = await addFilmAction({ externalId: film.externalId, intent })
      setAdding(null)

      if (!result.ok) {
        setError(result.message)
        return
      }
      // Already on the list — say so rather than pretending something happened.
      if (!result.value.created) {
        setError(`${film.title} is already on your list.`)
        return
      }
      setUndo({ entryId: result.value.entryId, title: film.title })
    })

    inputRef.current?.focus()
  }

  function undoAdd() {
    if (!undo) return
    const { entryId } = undo
    setUndo(null)
    startTransition(async () => {
      const result = await undoEntryAction(entryId)
      if (!result.ok) setError(result.message)
    })
  }

  /**
   * `!chosen` is load bearing. Picking a film opens the intent sheet but leaves
   * `query` and `results` untouched, so without this the dropdown stays open —
   * and it is `absolute z-10` while the sheet is in normal flow underneath, so
   * it covers the sheet completely and swallows every click meant for it. The
   * list is a picker; once something is picked it has no reason to be there.
   */
  const showResults =
    !chosen && (visibleResults.length > 0 || (searching && trimmed.length >= 2))

  return (
    // gap-6: the field and whatever it has to say afterwards are two different
    // things, and the redesign is mostly a matter of letting them be that far
    // apart.
    <div className="flex flex-col gap-6">
      {/* --- input ------------------------------------------------------- */}
      <div className="relative">
        <label htmlFor="capture" className="sr-only">
          Add a film
        </label>
        <input
          id="capture"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('')
              setResults([])
            }
          }}
          /*
            Lift the box to the top of what is visible when a keyboard is about
            to take the bottom of the screen, so the results below it land in
            the space that remains.

            Touch only. On a pointer device there is no keyboard eating the
            viewport, and yanking the page on focus would be jarring for no
            reason. The delay lets the keyboard finish animating in — measuring
            before it settles scrolls to the wrong place.
          */
          onFocus={() => {
            if (!window.matchMedia('(pointer: coarse)').matches) return
            setTimeout(() => {
              inputRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
            }, 300)
          }}
          autoComplete="off"
          spellCheck={false}
          // The placeholder does the teaching on a brand new account (§8).
          placeholder="A film you want to see"
          /*
            Deliberately larger and taller than the form fields — it is the one
            thing on the page (§8), and after the redesign it is also the only
            thing above the fold that is not a film title.

            `text-base` rather than the `input-text` utility the auth fields
            wear. That utility exists to sit at 13px with a mouse and 16px on
            touch, because iOS Safari zooms the viewport on focus below 16 and
            never zooms back; 16px flat clears the same threshold and is the
            right size here regardless of pointer. This field is not part of a
            form that has to be internally consistent, so it does not have to
            take the compromise the forms take.
          */
          className="bg-surface border-rule placeholder:text-muted focus:border-muted w-full rounded-lg border px-4 py-4 text-base leading-6 outline-none transition-colors"
        />

        {showResults && (
          <ul
            role="listbox"
            aria-label="Search results"
            /*
              `max-h` and a scroll of its own, rather than `overflow-hidden`.

              Found in landscape on a phone: the dropdown is absolutely
              positioned, so it adds nothing to the page's scroll height, and it
              had no height cap, so it rendered as tall as its contents into the
              two thirds of the screen the keyboard was covering. Nothing was
              broken and nothing was reachable either.

              `dvh` rather than `vh` so the cap follows the viewport the browser
              actually has, and `overscroll-contain` so reaching the end of the
              list does not start scrolling the page behind it.
            */
            className="bg-surface border-rule absolute z-10 mt-1.5 max-h-[50dvh] w-full overflow-y-auto overscroll-contain rounded-md border"
          >
            {visibleResults.map((film) => (
              <li key={film.externalId} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => setChosen(film)}
                  className="hover:bg-bg/60 flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
                >
                  <Poster posterPath={film.posterPath} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{film.title}</span>
                    <span className="micro text-muted mt-1 block">
                      {film.year ?? '—'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {visibleResults.length === 0 && searching && (
              <li className="text-muted px-3 py-2.5 text-sm">Looking…</li>
            )}
          </ul>
        )}
      </div>

      {/* --- the intent sheet (§8) --------------------------------------- */}
      {chosen && <IntentSheet film={chosen} onPick={add} onClose={() => setChosen(null)} />}

      {/* --- acknowledgement / undo / errors ------------------------------ */}
      {adding && (
        <p className="text-muted -mt-2 truncate text-sm">Adding {adding}…</p>
      )}
      {undo && (
        <p className="text-muted -mt-2 flex items-center gap-3 text-sm">
          <span className="truncate">Added {undo.title}.</span>
          <button
            type="button"
            onClick={undoAdd}
            // A ten-second window (§5). Missing it because the target was
            // 30px wide is not a recoverable mistake.
            className="hover:text-text tap-target shrink-0 underline underline-offset-4 transition-colors"
          >
            Undo
          </button>
        </p>
      )}
      {/*
        Full strength, at body size. It was `text-muted text-sm` — a failure
        message in the colour reserved for things that do not matter. Same
        correction as the resolve error in `entry-row.tsx`; see docs/decisions.md.
      */}
      {error && <p className="-mt-2">{error}</p>}
    </div>
  )
}

/**
 * One result row per item, not one per intent (§8). The default action is
 * prominent and the secondary intent sits quieter beneath it — splitting search
 * results by intent would double every result to serve the rarer case, and put
 * a decision in the fastest interaction in the app.
 */
function IntentSheet({
  film,
  onPick,
  onClose,
}: {
  film: FilmSearchResult
  onPick: (film: FilmSearchResult, intent: Intent) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [primary, ...secondary] = intentsFor('film')

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
      tabIndex={-1}
      className="border-rule bg-surface flex flex-col gap-5 rounded-lg border p-5 outline-none"
    >
      {/*
        The poster earns its place here, unlike in the list: this is the moment
        you are choosing between two films that may share a title, and the
        artwork is the fastest way to tell them apart. See `poster.tsx`.
      */}
      <div className="flex items-center gap-3">
        <Poster posterPath={film.posterPath} />
        <div className="min-w-0">
          <p className="truncate">{film.title}</p>
          <p className="micro text-muted mt-1">{film.year ?? '—'}</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          onClick={() => onPick(film, primary)}
          className="border-rule hover:border-text w-full rounded border px-4 py-3 text-left text-sm transition-colors sm:w-auto"
        >
          {specFor('film', primary).wantLabel}
        </button>

        {secondary.map((intent) => (
          <button
            key={intent}
            type="button"
            onClick={() => onPick(film, intent)}
            className="text-muted hover:text-text tap-target text-left text-sm underline underline-offset-4 transition-colors"
          >
            {specFor('film', intent).wantLabel}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-muted hover:text-text micro tap-target self-start transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
