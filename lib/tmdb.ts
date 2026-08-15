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
    **How far the window reaches**, which only the two list endpoints send —
    `/search/movie` has no such thing, hence optional here as well.

    It is the answer to a question the app could not previously make: *how soon
    is "coming soon"?* The window was arriving in every response and being
    discarded on parse, so the wall knew its own span and never said it.

    Optional for the same reason as the paging fields above. A caption that
    quietly loses its date is better than a wall that throws because TMDB
    reshaped an envelope.
  */
  dates: z.object({ minimum: z.string(), maximum: z.string() }).optional(),
  results: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      release_date: z.string().optional(),
      poster_path: z.string().nullable().optional(),
    }),
  ),
})

const detailsResponse = z.object({
  id: z.number(),
  title: z.string(),
  release_date: z.string().optional(),
  poster_path: z.string().nullable().optional(),
  credits: z
    .object({
      crew: z.array(z.object({ job: z.string(), name: z.string() })).optional(),
    })
    .optional(),
})

export type FilmDetails = {
  externalId: string
  title: string
  year: number | null
  posterPath: string | null
  directors: string[]
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
 * Posterless films are dropped rather than given a placeholder. The screen is
 * nothing but artwork, so a film with none has nothing to contribute to it.
 *
 * `Promise.all`, so the two calls cost one round trip rather than two. A failure
 * in either propagates — see the caller for what an empty screen looks like.
 */
export type CinemaListing = {
  films: FilmSearchResult[]
  /**
   * The last date the listing reaches, ISO, or `null` when TMDB did not say —
   * see `dates` on the response schema. The caller turns it into the caption's
   * "to 12 September"; nothing else reads it.
   */
  through: string | null
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

  const [playing, upcoming] = await Promise.all([
    tmdb(`/movie/now_playing?language=en-US&page=1${scope}`, IN_CINEMAS_TTL),
    tmdb(`/movie/upcoming?language=en-US&page=1${scope}`, IN_CINEMAS_TTL),
  ])

  const parse = (raw: unknown) => {
    const parsed = searchResponse.safeParse(raw)
    if (!parsed.success) throw new TmdbError('Unexpected TMDB list response', 502)
    return parsed.data
  }

  const lists = [parse(playing), parse(upcoming)]
  const films = lists.flatMap((list) => list.results)

  /*
    **The far edge of the two windows together**, which is what the wall can
    honestly claim to reach — the lists are merged, so neither endpoint's span
    describes it alone.

    ISO dates sort lexicographically, so `sort().at(-1)` is the latest without
    parsing anything into a `Date`. `null` when neither response carried the
    field, which is the caption losing a clause rather than inventing one.
  */
  const through =
    lists
      .map((list) => list.dates?.maximum)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1) ?? null

  // The two lists overlap around a release date, and a wall that shows the same
  // poster twice looks like a bug rather than a coincidence.
  const seen = new Set<number>()

  /*
    **Nearest to today first, in both directions.**

    ⚠ This sorted newest-first until 15 August, which is `upcoming` descending —
    so the wall opened on the film furthest from being watchable and what is
    actually on was below the fold. The comment above already claimed it was
    *"what is on now, then what is coming"*; the sort had been the other way
    round the whole time.

    It matters because the wall is a prompt and a prompt works on recognition.
    The far end of `upcoming` is posters for films nobody has seen a trailer for.

    **Distance, rather than two blocks.** One comparator, no record needed of
    which endpoint a film arrived from, and it puts "out last week" beside "out
    next week" — which is how anyone thinks about the cinema.

    `MAX_SAFE_INTEGER` and not `Infinity` for undated films: two of those would
    subtract to `NaN`, and a comparator returning `NaN` has no defined ordering.
    They sort last either way, which an empty-string compare did not manage.
  */
  const now = Date.now()
  const fromToday = (date?: string) => {
    const at = date ? Date.parse(date) : NaN
    return Number.isNaN(at) ? Number.MAX_SAFE_INTEGER : Math.abs(at - now)
  }

  return {
    through,
    films: films
      .filter((r) => {
        if (!r.poster_path || seen.has(r.id)) return false
        seen.add(r.id)
        return true
      })
      .sort((a, b) => fromToday(a.release_date) - fromToday(b.release_date))
      .map((r) => ({
        externalId: String(r.id),
        title: r.title,
        year: yearOf(r.release_date),
        posterPath: r.poster_path ?? null,
      })),
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
  }
}
