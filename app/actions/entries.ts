'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { headers } from 'next/headers'

import {
  addEntry,
  requireSessionUser,
  resolveEntry,
  undoEntry,
  upsertItem,
} from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { getFilm } from '@/lib/tmdb'
import { intentsFor } from '@/lib/vocabulary'
import type { Intent } from '@/lib/domain'

/**
 * Thin actions delegating to `lib/db/` (§3). Auth is re-verified inside each
 * one, because a Server Action is a separate entry point and a page-level check
 * does not cover it.
 */

export type ActionResult<T = null> =
  | { ok: true; value: T }
  | { ok: false; message: string }

const addSchema = z.object({
  // TMDB ids are numeric strings; anything else is not a film.
  externalId: z.string().regex(/^\d{1,12}$/),
  // v1 is films only, so `try` and `read` are not reachable yet even though the
  // domain names them. Narrowed here rather than at the call site, so the
  // boundary rejects them rather than the compiler merely discouraging them.
  intent: z.enum(['see', 'own']),
})

/** What the client may ask for. Runtime narrowing happens in `addSchema`. */
export type AddFilmInput = { externalId: string; intent: Intent }

/**
 * Adding a film. Resolves the canonical `items` row from TMDB first — free text
 * that never resolves to a canonical entity silently kills overlap, and the
 * failure is invisible for months (§8).
 */
export async function addFilmAction(
  input: AddFilmInput,
): Promise<ActionResult<{ entryId: string; created: boolean }>> {
  const sessionUser = await requireSessionUser()

  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'That does not look like a film.' }

  for (const identifier of [sessionUser.id, clientIp(await headers())]) {
    const limit = await rateLimit('entryCreate', identifier)
    if (!limit.ok) return { ok: false, message: 'Slow down a moment.' }
  }

  const film = await getFilm(parsed.data.externalId)
  if (!film) return { ok: false, message: 'That film is no longer in the catalogue.' }

  const item = await upsertItem(sessionUser, {
    kind: 'film',
    externalSource: 'tmdb',
    externalId: film.externalId,
    title: film.title,
    year: film.year,
    metadata: { posterPath: film.posterPath, directors: film.directors },
  })

  const result = await addEntry(sessionUser, {
    itemId: item.id,
    intent: parsed.data.intent,
  })

  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return {
    ok: true,
    value: { entryId: result.value.entry.id, created: result.value.created },
  }
}

const entryIdSchema = z.string().uuid()

export async function resolveEntryAction(
  entryId: string,
  keep: boolean,
): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!entryIdSchema.safeParse(entryId).success) {
    return { ok: false, message: 'Unknown entry.' }
  }

  const result = await resolveEntry(sessionUser, entryId, keep)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, value: null }
}

export async function undoEntryAction(entryId: string): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!entryIdSchema.safeParse(entryId).success) {
    return { ok: false, message: 'Unknown entry.' }
  }

  const result = await undoEntry(sessionUser, entryId)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, value: null }
}

/** v1 offers `see` and `own` for films, default first (§8). */
export async function filmIntents() {
  return intentsFor('film')
}
