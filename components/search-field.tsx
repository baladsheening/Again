'use client'

import { useEffect, useRef, useState } from 'react'

import type { FilmSearchResult } from '@/lib/domain'
import { useCapture } from './capture-provider'
import { Poster } from './poster'

/**
 * Search, in either of the two places it lives.
 *
 * §8's load-bearing requirement is here and unchanged: **it resolves as you
 * type**. Free text that never resolves to a canonical entity silently kills
 * overlap, and the failure is invisible for months — so this is a picker over
 * TMDB, never a text box that accepts what you typed.
 *
 * `page` is the field at the top of the home screen at rail widths. `bar` is the
 * same field inside the phone's bottom bar, where the results have to open
 * *upward* because there is nothing below it but the edge of the screen.
 */

const DEBOUNCE_MS = 220

export function SearchField({
  placement,
  onActiveChange,
}: {
  placement: 'page' | 'bar'
  /** Bar only: lets the shell keep the bar on screen while this is in use. */
  onActiveChange?: (active: boolean) => void
}) {
  const { choose } = useCapture()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FilmSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const inBar = placement === 'bar'

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
  const showResults = visibleResults.length > 0 || (searching && trimmed.length >= 2)

  // The shell holds the bar still while this is in use: a bar that slid away
  // mid-search would take the field with it.
  useEffect(() => {
    onActiveChange?.(focused || trimmed.length > 0)
  }, [focused, trimmed, onActiveChange])

  function pick(film: FilmSearchResult) {
    // Clear before handing over. The sheet is an overlay now, so without this
    // the results would still be sitting behind it when it closes.
    setQuery('')
    setResults([])
    choose(film)
    inputRef.current?.blur()
  }

  return (
    <div className={`relative ${inBar ? 'min-w-0 flex-1' : ''}`}>
      <label htmlFor={`search-${placement}`} className="sr-only">
        Search for a film
      </label>

      <div className={inBar ? 'flex items-center gap-1.5' : undefined}>
        {/*
          A prompt, not a control. The caret blinks only while the field is empty
          and unfocused: once it has focus the browser draws the real one, and
          two carets in a row is a bug rather than an effect.
        */}
        {inBar && !focused && trimmed.length === 0 && (
          <span
            aria-hidden
            className="bg-muted animate-caret h-[1.1em] w-px shrink-0 self-center"
          />
        )}

        <input
          id={`search-${placement}`}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('')
              setResults([])
              inputRef.current?.blur()
            }
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder={inBar ? 'search' : 'A film you want to see'}
          className={
            inBar
              ? // Borderless and transparent: the bar is the field's container,
                // and a box inside a box would read as two surfaces. 16px is not
                // a style choice — iOS Safari zooms the viewport on focus below
                // it and does not zoom back.
                'placeholder:text-muted/70 w-full min-w-0 bg-transparent text-base leading-6 outline-none'
              : 'bg-surface border-rule placeholder:text-muted focus:border-muted w-full rounded-lg border px-4 py-4 text-base leading-6 outline-none transition-colors'
          }
        />
      </div>

      {showResults && (
        <ul
          role="listbox"
          aria-label="Search results"
          /*
            `bottom-full` in the bar, so the list grows up off the field instead
            of into the screen edge. That also puts it where the keyboard is not:
            the viewport is `interactiveWidget: 'resizes-content'`, so an open
            keyboard shrinks the layout viewport and this opens into what remains.

            `dvh` rather than `vh` so the cap follows the viewport the browser
            actually has, and `overscroll-contain` so reaching the end of the list
            does not start scrolling the page behind it.
          */
          className={`bg-surface border-rule absolute z-10 max-h-[50dvh] w-full overflow-y-auto overscroll-contain rounded-md border ${
            inBar ? 'bottom-full mb-3' : 'mt-1.5'
          }`}
        >
          {visibleResults.map((film) => (
            <li key={film.externalId} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => pick(film)}
                className="hover:bg-bg/60 flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
              >
                <Poster posterPath={film.posterPath} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{film.title}</span>
                  <span className="micro text-muted mt-1 block">{film.year ?? '—'}</span>
                </span>
              </button>
            </li>
          ))}
          {visibleResults.length === 0 && searching && (
            <li className="text-muted px-3.5 py-2.5 text-sm">Looking…</li>
          )}
        </ul>
      )}

      {error && <p className={inBar ? 'sr-only' : 'mt-2'}>{error}</p>}
    </div>
  )
}
