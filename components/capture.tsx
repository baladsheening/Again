'use client'

import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { EntryCard, FilmSearchResult, Intent } from '@/lib/domain'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { EntryRow } from './entry-row'
import { Poster } from './poster'

/**
 * The whole home screen (§8): an input box at the top, the live list directly
 * beneath. This makes Again a capture tool first and a browsing tool second,
 * which is what the rest of the design assumes.
 *
 * Two requirements from §8, both load bearing:
 *  - It resolves as you type. Free text that never resolves to a canonical
 *    entity silently kills overlap, and the failure is invisible for months.
 *  - It is never blank underneath.
 */

const DEBOUNCE_MS = 220
const UNDO_WINDOW_MS = 10_000

export function Capture({ entries }: { entries: EntryCard[] }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FilmSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [chosen, setChosen] = useState<FilmSearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ entryId: string; title: string } | null>(null)

  const [isPending, startTransition] = useTransition()
  const [optimistic, addOptimistic] = useOptimistic(
    entries,
    (state, card: EntryCard) => [card, ...state],
  )

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

    startTransition(async () => {
      // Optimistic (§10). If the action fails this reverts on its own when the
      // transition ends, which is the rollback.
      addOptimistic({
        id: `optimistic-${film.externalId}-${intent}`,
        kind: 'film',
        intent,
        state: 'want',
        title: film.title,
        year: film.year,
        posterPath: film.posterPath,
        returnCount: 0,
      })

      const result = await addFilmAction({ externalId: film.externalId, intent })

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
    <div className="flex flex-col gap-4">
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
          autoComplete="off"
          spellCheck={false}
          // The placeholder does the teaching on a brand new account (§8).
          placeholder="A film you want to see"
          // Deliberately taller than the form fields — it is the one thing on
          // the page (§8). `input-text` rather than a literal size so it still
          // clears iOS Safari's 16px zoom threshold on touch.
          className="bg-surface border-rule placeholder:text-muted focus:border-muted input-text w-full rounded-md border px-3.5 py-3 leading-5 outline-none transition-colors pointer-coarse:leading-6"
        />

        {showResults && (
          <ul
            role="listbox"
            aria-label="Search results"
            className="bg-surface border-rule absolute z-10 mt-1.5 w-full overflow-hidden rounded-md border"
          >
            {visibleResults.map((film) => (
              <li key={film.externalId} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => setChosen(film)}
                  className="hover:bg-bg/60 flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
                >
                  <Poster posterPath={film.posterPath} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{film.title}</span>
                    <span className="text-muted block text-xs">
                      {film.year ?? '—'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {visibleResults.length === 0 && searching && (
              <li className="text-muted px-3 py-2.5 text-[13px]">Looking…</li>
            )}
          </ul>
        )}
      </div>

      {/* --- the intent sheet (§8) --------------------------------------- */}
      {chosen && <IntentSheet film={chosen} onPick={add} onClose={() => setChosen(null)} />}

      {/* --- undo / errors ----------------------------------------------- */}
      {undo && (
        <p className="text-muted flex items-center gap-3 text-sm">
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
      {error && <p className="text-muted text-sm">{error}</p>}

      {/* --- the live list ----------------------------------------------- */}
      {optimistic.length > 0 ? (
        <ul className="flex flex-col">
          {optimistic.map((card) => (
            <EntryRow
              key={card.id}
              card={card}
              pending={isPending && card.id.startsWith('optimistic-')}
            />
          ))}
        </ul>
      ) : (
        // Empty states instruct rather than apologise (§10).
        <p className="text-muted py-8 text-sm">
          Start with one film. Anything you have been meaning to watch.
        </p>
      )}
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
      className="border-rule bg-surface flex flex-col gap-4 rounded-lg border p-4 outline-none"
    >
      <div className="flex items-center gap-3">
        <Poster posterPath={film.posterPath} />
        <div className="min-w-0">
          <p className="truncate">{film.title}</p>
          <p className="text-muted text-xs">{film.year ?? '—'}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onPick(film, primary)}
          className="border-rule hover:border-text rounded border px-4 py-2.5 text-left text-sm transition-colors"
        >
          {specFor('film', primary).wantLabel}
        </button>

        {secondary.map((intent) => (
          <button
            key={intent}
            type="button"
            onClick={() => onPick(film, intent)}
            className="text-muted hover:text-text px-4 py-1.5 text-left text-sm transition-colors"
          >
            {specFor('film', intent).wantLabel}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-muted hover:text-text self-start text-xs transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
