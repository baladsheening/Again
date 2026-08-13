'use client'

import { usePathname } from 'next/navigation'
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

function scrollSearchRootToTop() {
  window.scrollTo({ top: 0, behavior: 'instant' })
}

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

/**
 * Why a search produced nothing, when the reason is not "nothing matched".
 *
 * **These were all one thing until 10 August, and the one thing was silence.**
 * `fetchPage` turned every non-2xx response into `null`, the provider turned
 * `null` into zero results, and the wall said *Nothing by that name.* — so a
 * rate limit, an expired session and TMDB being down all read as a confident
 * statement about the film you were looking for. The worst of them is the rate
 * limit, because it arrives exactly when someone is typing fast, and the advice
 * it silently gives is "that film does not exist, try another one", which
 * spends more of the budget that ran out.
 *
 * They are separate here because the answer differs: wait, sign in again, or
 * try again.
 */
export type SearchFailure = 'rate-limited' | 'signed-out' | 'unavailable'

type SearchState = {
  query: string
  setQuery: (q: string) => void
  /** Whether the wall should be showing results rather than the listing. */
  active: boolean
  results: FilmSearchResult[]
  searching: boolean
  /**
   * Why the last request failed, or `null`. Read alongside `results`: empty
   * results means the failure is the whole answer, and results present means a
   * page failed underneath a wall that is still worth looking at.
   */
  failure: SearchFailure | null
  /**
   * Seconds until a rate limit lifts, straight off the route's `Retry-After`.
   * `null` for every other failure, and for a limiter that did not say.
   */
  retryAfter: number | null
  /** Whether TMDB has another page of matches for what is currently loaded. */
  hasMore: boolean
  /** Fetch the next page and append it. Safe to call repeatedly; guards itself. */
  loadMore: () => void
  /** Ask again for whichever request failed — the first page, or the next one. */
  retry: () => void
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

type PageResult =
  | { ok: true; page: SearchPage }
  /** `retryAfter` is seconds, and only ever set on a rate limit. */
  | { ok: false; failure: SearchFailure; retryAfter: number | null }

/**
 * One page from our own proxy, with the reason attached when there is not one.
 *
 * **An abort is rethrown rather than reported.** Every keystroke cancels the
 * request before it, so aborts are the common case here and not a failure at
 * all — folding them in with the network errors would put "Search is
 * unavailable" on the screen of anyone typing at speed. The signal is the thing
 * that tells them apart: a `fetch` that rejects while its own signal is aborted
 * was cancelled by us.
 */
async function fetchPage(q: string, page: number, signal?: AbortSignal): Promise<PageResult> {
  let res: Response
  try {
    res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`, { signal })
  } catch (cause) {
    if (signal?.aborted) throw cause
    // Offline, DNS, a dropped connection: nothing came back to read a status off.
    return { ok: false, failure: 'unavailable', retryAfter: null }
  }

  if (res.ok) {
    try {
      return { ok: true, page: (await res.json()) as SearchPage }
    } catch {
      // A 200 whose body did not parse is the upstream being wrong, not empty.
      return { ok: false, failure: 'unavailable', retryAfter: null }
    }
  }

  // The three the route can return — see app/api/search/route.ts. Anything else
  // is ours and unexpected, and reads the same way to the person searching.
  if (res.status === 429) {
    /*
      The route sends `Retry-After` and there is no reason to paraphrase it. "Give
      it a moment" is a guess in front of a number we were handed; the number is
      also the difference between waiting and pressing the button repeatedly,
      which is what someone does when told to wait an unspecified while.

      **Read, not obeyed.** Nothing here schedules an automatic retry: a limiter
      that is refusing requests is the last thing that should be sent more of
      them on a timer, and every attempt after this one is now a deliberate press
      by someone who has been told how long it will be.
    */
    const header = Number(res.headers.get('Retry-After'))
    const retryAfter = Number.isFinite(header) && header > 0 ? Math.ceil(header) : null
    return { ok: false, failure: 'rate-limited', retryAfter }
  }
  if (res.status === 401) return { ok: false, failure: 'signed-out', retryAfter: null }
  return { ok: false, failure: 'unavailable', retryAfter: null }
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('')
  const [loaded, setLoaded] = useState<Loaded>(NOTHING)
  const [searching, setSearching] = useState(false)
  const [focused, setFocused] = useState(false)

  /**
   * Which request cycle the field is on. Bumped by `retry` and by `clear`.
   *
   * `retry` needs it because a failure is deliberately not cached, so asking
   * again has to be a real request rather than a replay of the miss — and the
   * effect below keys off the query string, which has not changed. This is the
   * thing that has.
   */
  const [attempt, setAttempt] = useState(0)

  /**
   * The last failure, carrying the request it belongs to.
   *
   * **Stamped rather than cleared**, for the reason `Loaded` carries its own `q`:
   * a failure that outlives the question it answers is worse than no failure at
   * all, and the way to make that unrepresentable is to write down what it was
   * about instead of remembering to erase it. Typing another letter, retrying
   * and emptying the field all move one of these two values, so all three stop
   * this being current without a line of code that says so.
   */
  const [failed, setFailed] = useState<{
    q: string
    attempt: number
    reason: SearchFailure
    retryAfter: number | null
  } | null>(null)

  /*
    A search belongs to the route it was run from.

    Without this, tapping *Archive* with `batman` still in the field left the same
    wall of results on screen — the tap did nothing visible, which reads as a
    dropped tap rather than as a search that outlived its page. The wall replacing
    the content of *every* route is deliberate (see the note at its use site) and
    this is not a retreat from it: running a search from anywhere is one thing,
    and having one follow you somewhere you deliberately navigated is another.

    **Adjusted during render rather than in an effect**, which is React's own
    prescription for state that has to follow a prop. An effect would render the
    new route once with the old results still up and clear them on the frame
    after, which is the flash this exists to prevent.
  */
  const pathname = usePathname()
  const [routeOfQuery, setRouteOfQuery] = useState(pathname)
  if (routeOfQuery !== pathname) {
    setRouteOfQuery(pathname)
    setQuery('')
    setLoaded(NOTHING)
    setSearching(false)
    setFailed(null)
    /*
      No `generation` bump here — it is declared below, and it does not need one.
      Emptying the field re-runs the request effect, whose cleanup aborts the
      flight in progress and whose body increments the counter. Nothing can paint
      in between, because `active` is already false by then.
    */
  }

  const trimmed = query.trim()
  const active = trimmed.length >= MIN_QUERY

  const failure =
    failed && failed.q === trimmed && failed.attempt === attempt ? failed.reason : null
  const retryAfter = failure === 'rate-limited' ? (failed?.retryAfter ?? null) : null

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

  /**
   * Whether a page beyond the first is in flight.
   *
   * **This replaced writing the page number forward before the request.** That
   * trick stopped two intersection callbacks in the same frame from both
   * fetching page 2, and did nothing about the case after it: the optimistic
   * write is a render, a render rebuilds `loadMore`, the wall's effect re-runs
   * against the new one, and the sentinel is still on screen because nothing has
   * arrived to push it down — so page 3 was requested while page 2 was in
   * flight, then 4, as fast as React could re-render. The replies then landed in
   * whatever order the network chose and `loaded.page` finished on whichever was
   * last, which could be *behind* what had already been merged in.
   *
   * A ref rather than state because it is read and written in the same tick that
   * the guard has to hold for, and a state update is not visible until the next
   * render — which is the whole distance the fault lived in.
   *
   * **It holds the generation it belongs to, not a boolean.** A plain flag is
   * raised by one query and lowered by whoever finishes last, so page 2 of
   * `batman` still in flight when the field moves to `batmanx` refused the new
   * query its second page — and, having been lowered by the stale reply, would
   * then have let a duplicate through. Stamped, it blocks only a request from
   * the generation that is current, and a straggler cannot clear a token that is
   * no longer its own.
   */
  const loadingMore = useRef<number | null>(null)

  /*
    Back to the top, because a new query is a new wall.

    This did not matter while a search was twenty posters — there was nowhere to
    be but the top. It matters now that one can run to hundreds: type another
    letter three screens into `batman` and, without this, you are three screens
    into a wall that has been replaced under you, looking at results you never
    scrolled to.

    `instant`, against the `scroll-behavior: smooth` set on `html` in
    globals.css. Smooth is right for a link to somewhere; animating a
    three-screen journey back up on a keystroke is not travel, it is a lurch.

    ⚠ **This scrolled `#scroll-root` by id until 13 August, and now scrolls the
    window.** The shell used to scroll inside a `fixed inset-0` element, so the
    document was always at zero and `window.scrollTo` moved nothing. That element
    is an ordinary block in the flow again — see the note on it in
    `components/shell.tsx` — so the document is the scroller and the id lookup
    would have found a box that no longer moves. Silent when wrong: the wall
    would simply stay where it was.

    **An effect of its own, keyed on the query alone**, because the request below
    also runs on `attempt` — and a retry is not a new wall. Pressing *Try again*
    under a page that failed happens at the foot of a few hundred posters, which
    is precisely where being thrown back to the top is least welcome.
  */
  useEffect(() => {
    if (trimmed.length < MIN_QUERY) return
    scrollSearchRootToTop()
  }, [trimmed])

  useEffect(() => {
    generation.current += 1
    const gen = generation.current

    if (trimmed.length < MIN_QUERY) return

    /*
      A hit renders this frame, with no debounce and no request. The synchronous
      `setLoaded` is exactly what the previous version of this effect avoided —
      and it is right here, because the render it costs *is* the feature.
    */
    const hit = cache.current.get(trimmed)
    if (hit) {
      scrollSearchRootToTop()
      setLoaded(hit)
      setSearching(false)
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const result = await fetchPage(trimmed, 1, controller.signal)
        if (gen !== generation.current) return

        /*
          A failure is not cached and does not replace what is on screen. The
          wall holds its last answer for the same reason it holds it while a new
          request is in flight — and if there is nothing to hold, the message
          the failure carries is what gets shown instead of a count of zero.
        */
        if (!result.ok) {
          setFailed({ q: trimmed, attempt, reason: result.failure, retryAfter: result.retryAfter })
          return
        }

        const next: Loaded = { q: trimmed, ...result.page }
        cache.current.set(trimmed, next)
        scrollSearchRootToTop()
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
  }, [trimmed, attempt])

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
    /*
      One page at a time, and the ref is what makes that true. `hasMore` cannot
      do it: it is derived from state, so it still describes the last render
      while a request is in the air, and every guard built on it was a guard the
      next render walked straight through.
    */
    const gen = generation.current
    if (!hasMore || searching || loadingMore.current === gen) return
    loadingMore.current = gen

    const q = loaded.q
    const next = loaded.page + 1

    void (async () => {
      try {
        const result = await fetchPage(q, next)
        if (gen !== generation.current) return

        /*
          Nothing moves on a failed page. `loaded` is untouched, so `loadMore`
          keeps its identity, so the wall's effect does not re-run and the
          observer cannot spin on it — it goes quiet until someone asks again,
          either by scrolling off the foot and back onto it or by pressing the
          retry the shell puts under the wall.
        */
        if (!result.ok) {
          setFailed({ q, attempt, reason: result.failure, retryAfter: result.retryAfter })
          return
        }

        /*
          Merged against the cache rather than against `prev` inside the updater,
          because building the merged list is also what is written to the cache —
          and a state updater must be free of side effects to be safe to call
          twice, which React does in development.

          The `Set` is not defensive: TMDB's pages overlap around a popularity
          tie, and the same film arriving twice would be a duplicate key in the
          wall as well as a poster shown twice.
        */
        const base = cache.current.get(q)?.results ?? []
        const seen = new Set(base.map((f) => f.externalId))
        const merged = [...base, ...result.page.results.filter((f) => !seen.has(f.externalId))]

        const grown: Loaded = {
          q,
          results: merged,
          page: result.page.page,
          totalPages: result.page.totalPages,
        }
        cache.current.set(q, grown)
        setLoaded((prev) => (prev.q === q ? grown : prev))
      } catch {
        // `fetchPage` only throws on an abort, and nothing aborts a page load.
      } finally {
        /*
          Cleared before the render this function's own `setLoaded` schedules, so
          the wall asking for the page after this one is never turned away by a
          token belonging to a request that has already landed — and only if the
          token is still this request's, so a straggler from a query nobody is
          looking at cannot unlock the one they are.
        */
        if (loadingMore.current === gen) loadingMore.current = null
      }
    })()
  }, [hasMore, searching, loaded.q, loaded.page, attempt])

  /**
   * Ask again for whatever failed.
   *
   * Which request that was is not tracked, because `results` already says: an
   * empty wall means the first page never arrived, and a full one means a later
   * page did not.
   *
   * `attempt` moves either way, which is what takes the message off the screen —
   * see `failed`. It also re-runs the effect, which is the request itself in the
   * first case and a cache hit costing one bail-out in the second.
   */
  const retry = useCallback(() => {
    setAttempt((n) => n + 1)
    if (loaded.q === trimmed && loaded.results.length > 0) {
      loadMore()
      return
    }
    /*
      Nothing worth holding. What is in `loaded` answers a question that is no
      longer being asked — clearing the notice would otherwise put those posters
      back up for one round trip, which is the thing suppressing them on failure
      was for. *Looking…* is the honest state while a retry is out.
    */
    setLoaded(NOTHING)
  }, [loadMore, loaded.q, loaded.results.length, trimmed])

  const clear = useCallback(() => {
    generation.current += 1
    setQuery('')
    setLoaded(NOTHING)
    setSearching(false)
    /*
      A new cycle, so a failure recorded against the old one cannot come back if
      the same query is typed again — which it will be, because the thing people
      do after a search goes wrong is search for it again.
    */
    setAttempt((n) => n + 1)
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

          **But holding stops the moment the new request fails.** `batman`'s
          posters under a field reading `batmanx` and a notice saying the search
          did not work is three things on one screen that contradict each other,
          and only the notice is true. Holding is right while an answer is coming;
          it is a lie once one is not.
        */
        results: active && (loaded.q === trimmed || !failure) ? loaded.results : [],
        searching,
        /*
          Below the minimum there is nothing being asked, so there is nothing
          that can have gone wrong — the same reasoning as `results` above.
        */
        failure: active ? failure : null,
        retryAfter,
        hasMore,
        loadMore,
        retry,
        focused,
        setFocused,
        clear,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
