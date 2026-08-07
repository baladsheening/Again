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

/** TMDB is upstream and untrusted like anything else — parse, don't assume. */
const searchResponse = z.object({
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

export async function searchFilms(query: string): Promise<FilmSearchResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const raw = await tmdb(
    `/search/movie?query=${encodeURIComponent(trimmed)}&include_adult=false&language=en-US&page=1`,
    SEARCH_TTL,
  )

  const parsed = searchResponse.safeParse(raw)
  if (!parsed.success) throw new TmdbError('Unexpected TMDB search response', 502)

  return parsed.data.results.slice(0, 8).map((r) => ({
    externalId: String(r.id),
    title: r.title,
    year: yearOf(r.release_date),
    posterPath: r.poster_path ?? null,
  }))
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
