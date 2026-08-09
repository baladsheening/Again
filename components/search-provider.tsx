'use client'

import { createContext, use, useEffect, useState } from 'react'

import type { FilmSearchResult } from '@/lib/domain'

/**
 * What is being searched for, held above both the field and the wall.
 *
 * The two are in different parts of the tree — the field is in the shell's
 * furniture, the wall is the page's content — and since 9 August they are the
 * same interaction: **typing replaces the wall of what is on with a wall of what
 * matched.** There is no results list any more.
 *
 * That is why this exists rather than the field owning its own state. A dropdown
 * can keep its results to itself; a wall cannot.
 *
 * §8's load-bearing requirement is unchanged and lives here now: **it resolves as
 * you type.** Free text that never resolves to a canonical entity silently kills
 * overlap, and the failure is invisible for months — so what you see is always
 * TMDB's answer, never what you typed.
 */

const DEBOUNCE_MS = 220
/**
 * One character is a search.
 *
 * It was two, on the reasoning that a single letter is not a query. That is true
 * of a dropdown, where one letter would drop a list of noise over the page; it
 * is not true of a wall, where the same twenty posters are just a different wall
 * to look at. Typing `b` now shows what TMDB returns for `b`.
 *
 * The floor is enforced in three places and all three had to move together: here,
 * the Zod schema in `app/api/search/route.ts`, and `searchFilms` in `lib/tmdb.ts`.
 */
const MIN_QUERY = 1

type SearchState = {
  query: string
  setQuery: (q: string) => void
  /** Whether the wall should be showing results rather than the listing. */
  active: boolean
  results: FilmSearchResult[]
  searching: boolean
  /** Field focus, so the phone's bar can hold still while it is in use. */
  focused: boolean
  setFocused: (f: boolean) => void
  clear: () => void
}

const SearchContext = createContext<SearchState | null>(null)

export function useSearch() {
  const ctx = use(SearchContext)
  if (!ctx) throw new Error('useSearch must be used inside SearchProvider')
  return ctx
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FilmSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [focused, setFocused] = useState(false)

  const trimmed = query.trim()
  const active = trimmed.length >= MIN_QUERY

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) return

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
          return
        }
        const body = (await res.json()) as { results: FilmSearchResult[] }
        setResults(body.results)
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

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        active,
        // Derived rather than cleared in the effect: below the minimum there is
        // nothing to show, and that is a fact about `query`, not state of its own.
        results: active ? results : [],
        searching,
        focused,
        setFocused,
        clear: () => {
          setQuery('')
          setResults([])
        },
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
