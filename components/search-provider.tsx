'use client'

import { createContext, use, useCallback, useEffect, useRef, useState } from 'react'

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

/**
 * How long the field is allowed to be quiet before a query goes upstream.
 *
 * **90ms, down from 220 on 10 August**, when the instruction became "real time".
 * The number is not arbitrary: a fast typist is at 100–150ms between letters, so
 * 220 waited out a deliberate pause *and* most ordinary ones, and the wall
 * arrived a beat after you had stopped rather than while you were still going.
 * 90 sits under the gap between letters, which means the request goes the moment
 * you are actually between words rather than mid-word.
 *
 * It cannot go to zero. A debounce of nothing sends a request per keystroke,
 * every one of them for a prefix nobody meant to search — and TMDB's answer for
 * `m`, `ma`, `mat` arrives in an order the network chooses, so the wall would
 * settle on whichever came back last rather than on what is in the field.
 * `generation` below is what makes that safe; the debounce is what makes it
 * cheap.
 *
 * ⚠ It pairs with the `search` limit in `lib/rate-limit.ts` — lowering this
 * further without raising that trades a slow wall for a 429.
 */
const DEBOUNCE_MS = 90
/**
 * One character is a search.
 *
 * It was two, on the reasoning that a single letter is not a query. That is true
 * of a dropdown, where one letter would drop a list of noise over the page; it
 * is not true of a wall, where the same twenty posters are just a different wall
 * to look at. Typing `b` now shows what TMDB returns for `b` — confirmed usable
 * by the person who asked for it, on 10 August.
 *
 * The floor is enforced in three places and all three had to move together: here,
 * the Zod schema in `app/api/search/route.ts`, and `searchFilms` in `lib/tmdb.ts`.
 */
const MIN_QUERY = 1

/** The shape the route returns. Parsed loosely — it is our own endpoint. */
type SearchPage = {
  results: FilmSearchResult[]
  page: number
  totalPages: number
}

/**
 * Everything known about one query, as a single value.
 *
 * **The four fields are one piece of state on purpose.** Held separately, a
 * keystroke could leave `results` describing the old query while `page` and
 * `totalPages` described the new one — and *load more* would then append page 2
 * of what you are typing now onto the results of what you typed a moment ago.
 * Carrying `q` alongside them makes that unrepresentable: nothing pages unless
 * the loaded query and the typed query are the same string.
 */
type Loaded = SearchPage & { q: string }

const NOTHING: Loaded = { q: '', results: [], page: 0, totalPages: 0 }

type SearchState = {
  query: string
  setQuery: (q: string) => void
  /** Whether the wall should be showing results rather than the listing. */
  active: boolean
  results: FilmSearchResult[]
  searching: boolean
  /** Whether TMDB has another page of matches for what is currently loaded. */
  hasMore: boolean
  /** Fetch the next page and append it. Safe to call repeatedly; guards itself. */
  loadMore: () => void
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

async function fetchPage(
  q: string,
  page: number,
  signal?: AbortSignal,
): Promise<SearchPage | null> {
  const res = await fetch(
    `/api/search?q=${encodeURIComponent(q)}&page=${page}`,
    { signal },
  )
  if (!res.ok) return null
  return (await res.json()) as SearchPage
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('')
  const [loaded, setLoaded] = useState<Loaded>(NOTHING)
  const [searching, setSearching] = useState(false)
  const [focused, setFocused] = useState(false)

  const trimmed = query.trim()
  const active = trimmed.length >= MIN_QUERY

  /**
   * Every query typed this session, with however many pages of it were pulled.
   *
   * This is most of what makes the field feel immediate. Backspacing out of
   * `matrix` to `matri` is not a new question — it is one already answered two
   * keystrokes ago — and a cache turns it from a debounce plus a round trip into
   * a render. Correcting a typo is the single most common thing anyone does in a
   * search field, and it now costs nothing at all.
   *
   * A ref rather than state: writing to it must never itself cause a render, and
   * nothing reads it during one.
   *
   * Unbounded, and deliberately. Entries are a query string and at most a few
   * hundred small objects, the map lives as long as the page does, and a session
   * that typed enough distinct queries to matter would have made the requests
   * this exists to avoid.
   */
  const cache = useRef(new Map<string, Loaded>())

  /**
   * Which query the app is currently interested in.
   *
   * Incremented on every change to the field and on `clear`. A response checks
   * it before touching state, so an answer for `mat` that arrives after the
   * field has moved on to `matrix` is dropped rather than painted — the failure
   * a short debounce makes likely and `AbortController` alone does not cover,
   * since an abort races the response rather than beating it.
   */
  const generation = useRef(0)

  useEffect(() => {
    generation.current += 1
    const gen = generation.current

    if (trimmed.length < MIN_QUERY) return

    /*
      Back to the top, because a new query is a new wall.

      This did not matter while a search was twenty posters — there was nowhere
      to be but the top. It matters now that one can run to hundreds: type
      another letter three screens into `batman` and, without this, you are
      three screens into a wall that has been replaced under you, looking at
      results you never scrolled to.

      `instant`, against the `scroll-behavior: smooth` set on `html` in
      globals.css. Smooth is right for a link to somewhere; animating a
      three-screen journey back up on a keystroke is not travel, it is a lurch.
    */
    window.scrollTo({ top: 0, behavior: 'instant' })

    /*
      A hit renders this frame, with no debounce and no request. The synchronous
      `setLoaded` is exactly what the previous version of this effect avoided —
      and it is right here, because the render it costs *is* the feature.
    */
    const hit = cache.current.get(trimmed)
    if (hit) {
      setLoaded(hit)
      setSearching(false)
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const body = await fetchPage(trimmed, 1, controller.signal)
        if (gen !== generation.current) return
        const next: Loaded = body
          ? { q: trimmed, ...body }
          : { q: trimmed, results: [], page: 0, totalPages: 0 }
        cache.current.set(trimmed, next)
        setLoaded(next)
      } catch {
        // Aborted by the next keystroke — the expected path, not a failure.
      } finally {
        if (gen === generation.current) setSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [trimmed])

  /*
    Paging is only offered once page 1 of *this* query has landed. While the
    field is ahead of the results — the 90ms plus a round trip after a keystroke
    — `loaded.q` still names the previous query, and this is false.
  */
  const hasMore =
    active && loaded.q === trimmed && loaded.page > 0 && loaded.page < loaded.totalPages

  /**
   * The next twenty.
   *
   * Called by the wall when its foot comes into view, and called again as long
   * as it stays there — so a tall screen fills itself rather than stopping at
   * one page with the sentinel still visible. Every guard that makes that safe
   * is here rather than at the call site, because the caller is an
   * `IntersectionObserver` and observers fire more often than anyone expects.
   */
  const loadMore = useCallback(() => {
    if (!hasMore || searching) return

    const gen = generation.current
    const q = loaded.q
    const next = loaded.page + 1

    /*
      Marked in the cache *before* the request, not after. Two intersection
      callbacks in one frame would otherwise both pass the guard above and both
      fetch page 2 — the classic double-append. Writing the page forward first
      makes the second call a no-op via `hasMore` on the next render, and a
      failed request rolls it back below.
    */
    setLoaded((prev) => (prev.q === q ? { ...prev, page: next } : prev))

    void (async () => {
      let body: SearchPage | null = null
      try {
        body = await fetchPage(q, next)
      } catch {
        body = null
      }

      if (gen !== generation.current) return

      if (!body) {
        // Put the page back so the foot of the wall can try again on the next
        // scroll rather than going quiet for the rest of the session.
        setLoaded((prev) => (prev.q === q && prev.page === next ? { ...prev, page: next - 1 } : prev))
        return
      }

      /*
        Merged against the cache rather than against `prev` inside the updater,
        because building the merged list is also what is written to the cache —
        and a state updater must be free of side effects to be safe to call
        twice, which React does in development.

        The `Set` is not defensive: TMDB's pages overlap around a popularity tie,
        and the same film arriving twice would be a duplicate key in the wall as
        well as a poster shown twice.
      */
      const base = cache.current.get(q)?.results ?? []
      const seen = new Set(base.map((f) => f.externalId))
      const merged = [...base, ...body.results.filter((f) => !seen.has(f.externalId))]

      const grown: Loaded = {
        q,
        results: merged,
        page: body.page,
        totalPages: body.totalPages,
      }
      cache.current.set(q, grown)
      setLoaded((prev) => (prev.q === q ? grown : prev))
    })()
  }, [hasMore, searching, loaded.q, loaded.page])

  const clear = useCallback(() => {
    generation.current += 1
    setQuery('')
    setLoaded(NOTHING)
    setSearching(false)
  }, [])

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        active,
        /*
          Derived rather than cleared in the effect: below the minimum there is
          nothing to show, and that is a fact about `query`, not state of its own.

          Above the minimum this is deliberately the *last* answer rather than
          nothing while a new one is in flight — the wall holds what it has until
          it has something better, so typing another letter never blanks the
          screen and then fills it again.
        */
        results: active ? loaded.results : [],
        searching,
        hasMore,
        loadMore,
        focused,
        setFocused,
        clear,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
