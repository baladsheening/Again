import 'server-only'

import { z } from 'zod'

import { env } from '@/lib/env'
import type { FilmSearchResult } from '@/lib/domain'

/**
 * The only module that knows TMDB's response shape. Everything downstream sees
 * `FilmSearchResult` and `FilmDetails`, so replacing the catalogue is a change
 * to this file rather than to the app (see docs/decisions.md).
 *
 * `server-only`: §10 requires the credential never reach a client bundle.
 */

const BASE = 'https://api.themoviedb.org/3'

/**
 * Film metadata is immutable in practice (§10), so details cache for a month.
 * Search caches for an hour — TMDB does add films, but not to the answer of
 * "the matrix" within a working session.
 */
const DETAILS_TTL = 60 * 60 * 24 * 30
const SEARCH_TTL = 60 * 60
/**
 * What is in cinemas changes on a Friday, not on a Tuesday afternoon. Six hours
 * means four upstream calls a day however many people open the app, which is the
 * point: this is the one request every signed-in session makes before it does
 * anything else, so it is the one that must never be per-user.
 *
 * **Per region since 15 August, and still never per user.** The region rides in
 * the URL, and Next's data cache keys on the URL — so it fragments into four
 * calls a day for each country anybody opens the app from, and no further. That
 * is the right granularity: two people in the same country are asking the same
 * question and should not each pay for it.
 */
const IN_CINEMAS_TTL = 60 * 60 * 6

/**
 * How many pages of each cinema listing to pull.
 *
 * A ceiling rather than a target: `wholeList` asks for `total_pages` and stops
 * there, so a market with two pages costs two calls. This exists so that a
 * malformed `total_pages` — or a market far larger than any expected — cannot
 * turn one page render into a hundred upstream requests.
 *
 * Ten pages is two hundred films per list, which is past the size of any
 * national theatrical listing TMDB carries. If a market ever hits it, the wall
 * silently loses its tail and this is the number to raise.
 */
const LIST_PAGE_CAP = 10

/**
 * TMDB pages search results twenty at a time and refuses to go past page 500,
 * so about ten thousand results are reachable for a broad query. The cap is
 * theirs, not ours — asking for 501 is a 400 rather than an empty page.
 */
export const MAX_PAGE = 500

/** TMDB is upstream and untrusted like anything else — parse, don't assume. */
const searchResponse = z.object({
  /*
    Both optional because `inCinemas` parses with this schema too and does not
    care about either — and because a paging field that vanished upstream should
    degrade to "there is one page" rather than throw away results that arrived
    perfectly well.
  */
  page: z.number().optional(),
  total_pages: z.number().optional(),
  /*
    ⚠ **There was a `dates` object parsed here for a few hours on 15 August.**
    The two list endpoints send the window they were asked for, and it was read
    so the wall's caption could say how far "coming soon" reaches. The caption
    was then cut back to two words on instruction, which left the field with no
    reader — so it is gone rather than kept in case.

    If a date is ever wanted back, it is `dates: z.object({ minimum: z.string(),
    maximum: z.string() }).optional()`, optional because `/search/movie` parses
    with this schema too and has no such envelope. The answer it gave is
    otherwise visible as the last poster in *Coming soon*.
  */
  results: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      release_date: z.string().optional(),
      poster_path: z.string().nullable().optional(),
      /**
       * ⚠ **Parsed, and deliberately never shipped.** The list endpoints carry a
       * synopsis for every result; `toResult` drops it, so this costs the client
       * nothing. It is read once, here, to pick which film the desk's panel
       * arrives holding — see `openingFilm`. Two hundred of these on the wire
       * would be about a hundred kilobytes for a paragraph nobody reads.
       */
      overview: z.string().nullable().optional(),
    }),
  ),
})

const detailsResponse = z.object({
  id: z.number(),
  title: z.string(),
  release_date: z.string().optional(),
  poster_path: z.string().nullable().optional(),
  /**
   * The synopsis. **Empty string rather than absent** for a film TMDB has no
   * write-up for, which is common enough on older and non-English titles that the
   * screen has to have an answer for it — see `film-screen.tsx`.
   */
  overview: z.string().nullable().optional(),
  /** Minutes. Null for anything unreleased or unmeasured. */
  runtime: z.number().nullable().optional(),
  credits: z
    .object({
      crew: z.array(z.object({ job: z.string(), name: z.string() })).optional(),
    })
    .optional(),
})

/**
 * ⚠ **Two consumers now, and they want different halves of it.** `addFilmAction`
 * reads the first four to fill `items.metadata`; the film screen reads the
 * synopsis and the runtime and never persists them. They stay one type and one
 * request because they are one document upstream, and TMDB's own cache
 * (`DETAILS_TTL`) makes the second read free.
 *
 * **The synopsis and the runtime are deliberately not written to `items`.** §5's
 * schema is a canonical row for a real thing, not a copy of somebody's
 * catalogue; a synopsis stored here is a synopsis that goes stale and that the
 * app then has to decide whether to trust. It is fetched where it is shown.
 */
export type FilmDetails = {
  externalId: string
  title: string
  year: number | null
  posterPath: string | null
  directors: string[]
  synopsis: string | null
  /** Minutes. */
  runtime: number | null
}

async function tmdb(path: string, revalidate: number): Promise<unknown> {
  if (!env.TMDB_READ_ACCESS_TOKEN) {
    throw new Error('TMDB_READ_ACCESS_TOKEN is not set.')
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      // Bearer rather than ?api_key= so the credential stays out of URLs, and
      // therefore out of request logs and Sentry breadcrumbs.
      Authorization: `Bearer ${env.TMDB_READ_ACCESS_TOKEN}`,
      accept: 'application/json',
    },
    next: { revalidate },
  })

  if (!res.ok) {
    throw new TmdbError(`TMDB ${res.status} for ${path.split('?')[0]}`, res.status)
  }

  return res.json()
}

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'TmdbError'
  }
}

/** Year only — the day and month are noise at every place we show a film. */
function yearOf(releaseDate: string | undefined): number | null {
  if (!releaseDate) return null
  const year = Number(releaseDate.slice(0, 4))
  return Number.isFinite(year) && year > 1800 ? year : null
}

/** One page of matches, and enough to know whether there is another. */
export type FilmSearchPage = {
  results: FilmSearchResult[]
  page: number
  /** TMDB's own count, capped at `MAX_PAGE` — what is *reachable*, not what exists. */
  totalPages: number
}

/**
 * ⚠ **TMDB has no prefix search.** `/search/movie?query=b` does not mean "films
 * beginning with b" — it is a relevance match ranked by popularity, and there is
 * no endpoint that does the other thing. So a single letter returns TMDB's best
 * guesses for that letter in popularity order, and page 5 is the 81st–100th of
 * them. **It never becomes an alphabetical run**, however deep it is paged.
 *
 * That caveat is the reason this takes a page number rather than a count of
 * films: depth here buys *more matches*, not *completeness*, and no number of
 * requests turns one into the other.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Why one page per call (10 August)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The instruction was "as many results as possible, in real time", and the
 * tempting reading is to fetch three or four pages here and return sixty films
 * from one call. That was rejected: this function runs on a debounce measured in
 * tens of milliseconds, so every page it fetches eagerly is fetched again for
 * every letter typed on the way to a word — including the letters nobody meant
 * to search for. Four pages per keystroke is four times the upstream bill for
 * posters that are, at that instant, three screens below the fold.
 *
 * So depth is pulled rather than pushed: the wall asks for page 2 when it is
 * scrolled to, and page 3 after that (`components/poster-wall.tsx`). First paint
 * costs exactly one request, as it always did, and the ten-thousandth result is
 * still reachable by someone who wants it. That is also what §10's pagination
 * rule asks for.
 */
export async function searchFilms(query: string, page = 1): Promise<FilmSearchPage> {
  const trimmed = query.trim()
  if (trimmed.length < 1) return { results: [], page: 1, totalPages: 0 }

  // Clamped rather than trusted. The route validates too, but this is the
  // boundary that actually talks to TMDB, and 501 is a 400 from them.
  const wanted = Math.min(Math.max(1, Math.trunc(page)), MAX_PAGE)

  const raw = await tmdb(
    `/search/movie?query=${encodeURIComponent(trimmed)}&include_adult=false&language=en-US&page=${wanted}`,
    SEARCH_TTL,
  )

  const parsed = searchResponse.safeParse(raw)
  if (!parsed.success) throw new TmdbError('Unexpected TMDB search response', 502)

  /*
    The whole page. It was `.slice(0, 8)`, which was the right number for a
    dropdown — eight rows is as much list as anyone reads before retyping. The
    results are a wall of posters now, and eight posters is two thirds of one
    screen with the rest of it empty.
  */
  return {
    results: parsed.data.results.map((r) => ({
      externalId: String(r.id),
      title: r.title,
      year: yearOf(r.release_date),
      posterPath: r.poster_path ?? null,
    })),
    page: parsed.data.page ?? wanted,
    totalPages: Math.min(parsed.data.total_pages ?? 1, MAX_PAGE),
  }
}

/**
 * What is on, and what is about to be — the home screen.
 *
 * Two TMDB lists rather than one. `now_playing` alone is a short and slightly
 * stale window, and half of what a person means by "I want to see that" is a
 * film they have seen a trailer for and cannot watch yet. Together they are the
 * set of things worth capturing this month.
 *
 * **Order is release order, not popularity.** TMDB returns both lists ranked by
 * its own popularity score, and adopting that would make this a chart — which
 * §2 rules out, and which would quietly turn the home screen into the thing the
 * brief spends a paragraph warning about. Sorting by release date makes it a
 * calendar instead: what is on now, then what is coming.
 *
 * **It is every page of both lists**, not the first twenty of each — see
 * `wholeList`. A failure anywhere in it propagates; see the caller for what an
 * empty screen looks like.
 */
export type CinemaListing = {
  /** Released, most recently first. */
  nowShowing: FilmSearchResult[]
  /** Not yet released, soonest first. */
  comingSoon: FilmSearchResult[]
  /**
   * The film the desk's panel arrives holding — see `openingFilm` for how it is
   * picked and why the choice is made here rather than on the wall.
   */
  opening: FilmSearchResult | null
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Which film the panel opens with — 20 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It was *the first poster on the wall*, which is the honest reading of "the
 * first film" but takes whatever synopsis that film happens to have. **Directed:
 * it should be one with a fairly extensive synopsis**, because the panel's
 * synopsis prints and a two-line write-up is over before it reads as anything.
 *
 * ⚠ **The choice is the SERVER's, and that is not a preference.** The client is
 * sent `FilmSearchResult`, which has no synopsis and should not gain one — this
 * is the only place both the wall's order and the write-ups exist at once.
 *
 * **The threshold is derived from the print, not picked.** `PRINT_WPM` is 1800,
 * which is 153 characters a second, so 400 characters is about two and a half
 * seconds of printing — long enough to be a thing you watch happen rather than a
 * flicker. Below that the effect is wasted on the one film everybody sees first.
 *
 * ⚠ **It never returns nothing when there is something.** First past the post in
 * wall order, so the panel still holds a film from the top of the listing where
 * it can; if no synopsis reaches the mark, the longest one wins rather than the
 * rule failing and leaving the column empty.
 */
const SYNOPSIS_ENOUGH = 400

function openingFilm<T extends { overview?: string | null }>(
  ordered: T[],
  toResult: (film: T) => FilmSearchResult,
): FilmSearchResult | null {
  if (ordered.length === 0) return null

  const enough = ordered.find((film) => (film.overview?.length ?? 0) >= SYNOPSIS_ENOUGH)
  if (enough) return toResult(enough)

  const longest = ordered.reduce((best, film) =>
    (film.overview?.length ?? 0) > (best.overview?.length ?? 0) ? film : best,
  )
  return toResult(longest)
}

export async function inCinemas(region: string | null): Promise<CinemaListing> {
  /*
    **Region filters release dates to a country** — see `viewerRegion()` for
    where it comes from and why it is a guess rather than a setting. `null`
    omits it and takes TMDB's default, which is what every viewer got before
    15 August and is still what development sees.

    ⚠ **Region, not language.** `language` stays `en-US` deliberately. It decides
    the *title* TMDB returns, and the title on the wall is the title copied into
    `items` the moment somebody taps a poster — so localising it would write a
    French name into a row that a mutual track then reads, and `lib/overlap.ts`
    joins on `items`. The dates are regional; the canonical name is not.
  */
  const scope = region ? `&region=${region}` : ''

  const parse = (raw: unknown) => {
    const parsed = searchResponse.safeParse(raw)
    if (!parsed.success) throw new TmdbError('Unexpected TMDB list response', 502)
    return parsed.data
  }

  /*
    **Every page of a list, not the first twenty.**

    ⚠ **This took one page each until 15 August, and it was reported as a film
    missing from the wall** — something on in the UK that was simply below the
    twentieth most popular result. The wall was not *what is on*; it was *the
    twenty most popular things that are on*, and nothing on screen said so.

    **Depth is nearly free here, and that is the whole difference from search.**
    `searchFilms` pages lazily because a query runs on a debounce measured in
    tens of milliseconds, so an eagerly-fetched page is fetched again for every
    letter typed on the way to a word. This is one fixed set behind a six-hour
    cache keyed by URL, shared by everyone in a region — so a five-page listing
    costs five upstream calls per region per six hours however many people open
    the app, and buys completeness rather than more of a ranking.

    Page one first, because `total_pages` is only knowable from a response; the
    rest go together. Two round trips, not N.
  */
  const wholeList = async (path: string) => {
    const first = parse(await tmdb(`${path}&page=1`, IN_CINEMAS_TTL))
    const pages = Math.min(first.total_pages ?? 1, LIST_PAGE_CAP)
    if (pages < 2) return first.results

    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) => tmdb(`${path}&page=${i + 2}`, IN_CINEMAS_TTL)),
    )
    return [...first.results, ...rest.flatMap((raw) => parse(raw).results)]
  }

  const [playing, coming] = await Promise.all([
    wholeList(`/movie/now_playing?language=en-US${scope}`),
    wholeList(`/movie/upcoming?language=en-US${scope}`),
  ])

  /*
    **Which half a film belongs in is the endpoint that returned it.**

    ⚠ **It used to be inferred from `release_date`, and that was wrong twice
    over.** The lists were merged and then split again by comparing that field
    to today — discarding the one piece of ground truth in the response, since
    `now_playing` *means* showing and `upcoming` *means* not yet. And the field
    it inferred from is not reliably the regional date: a film out here now but
    released later in the United States reads as unreleased and lands under
    *Coming soon*, which is a wrong claim made confidently.

    So the date no longer decides anything. It orders each group, where being
    approximate costs a poster two rows out of place rather than a false label.

    The `seen` set is shared and `nowShowing` is built first, so a film in both
    lists is showing rather than coming — and the wall never draws the same
    poster twice, which reads as a bug rather than a coincidence.

    Posterless films are dropped rather than given a placeholder. The screen is
    nothing but artwork, so a film with none has nothing to contribute to it.
  */
  const seen = new Set<number>()
  const showable = (films: typeof playing) =>
    films.filter((r) => {
      if (!r.poster_path || seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

  const showing = showable(playing)
  const soon = showable(coming)

  type Listed = (typeof playing)[number]
  const toResult = (r: Listed): FilmSearchResult => ({
    externalId: String(r.id),
    title: r.title,
    year: yearOf(r.release_date),
    posterPath: r.poster_path ?? null,
  })

  /*
    Each group ordered towards the present: the newest release at the top of one,
    the soonest arrival at the top of the other. ISO dates sort
    lexicographically, so nothing is parsed into a `Date` and no timezone enters
    into it.

    An undated film sorts last in either group. Descending gets that from the
    empty string; ascending needs the sentinel, or a missing date would sort
    ahead of every real one and lead the section.
  */
  const UNDATED = '9999-99-99'

  const showingOrdered = showing.sort((a, b) =>
    (b.release_date ?? '').localeCompare(a.release_date ?? ''),
  )
  const soonOrdered = soon.sort((a, b) =>
    (a.release_date || UNDATED).localeCompare(b.release_date || UNDATED),
  )

  return {
    nowShowing: showingOrdered.map(toResult),
    comingSoon: soonOrdered.map(toResult),
    /*
      Sorted first, so "first past the post" means first *on the wall* rather
      than first out of TMDB — the two differ, and the wall's order is the one
      the panel's choice should agree with.
    */
    opening: openingFilm([...showingOrdered, ...soonOrdered], toResult),
  }
}

/**
 * Called when someone actually adds a film, to fill `items.metadata`. Search
 * results alone do not carry the director.
 */
export async function getFilm(externalId: string): Promise<FilmDetails | null> {
  let raw: unknown
  try {
    raw = await tmdb(`/movie/${encodeURIComponent(externalId)}?append_to_response=credits`, DETAILS_TTL)
  } catch (cause) {
    if (cause instanceof TmdbError && cause.status === 404) return null
    throw cause
  }

  const parsed = detailsResponse.safeParse(raw)
  if (!parsed.success) throw new TmdbError('Unexpected TMDB details response', 502)

  const d = parsed.data
  return {
    externalId: String(d.id),
    title: d.title,
    year: yearOf(d.release_date),
    posterPath: d.poster_path ?? null,
    directors: (d.credits?.crew ?? [])
      .filter((c) => c.job === 'Director')
      .map((c) => c.name),
    // Empty string and absent both mean the same thing to a reader, so they mean
    // the same thing here. The screen has one branch, not two.
    synopsis: d.overview?.trim() || null,
    runtime: d.runtime || null,
  }
}
