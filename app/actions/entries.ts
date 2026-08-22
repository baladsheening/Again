'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { headers } from 'next/headers'

import {
  addCapture,
  copyCapture,
  dropCapture,
  restoreCapture,
  setCaptureNote,
  NOTE_MAX,
  requireSessionUser,
  resolveCapture,
  undoCapture,
  upsertItem,
} from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { getFilm } from '@/lib/tmdb'
import { intentsFor } from '@/lib/vocabulary'
import type { EntryState, Intent } from '@/lib/domain'

/**
 * Thin actions delegating to `lib/db/` (§3). Auth is re-verified inside each
 * one, because a Server Action is a separate entry point and a page-level check
 * does not cover it.
 *
 * ⚠ **Every one of these writes a capture.** The action names still say entry,
 * and the components that call them are unchanged — the file is the seam
 * between a film-first interface and the capture model underneath it, and
 * renaming the seam is Phase 1's job, not this migration's. What matters here
 * is that nothing in this file can write to `entries`: the functions that did
 * no longer exist.
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
/**
 * ⚠ **`state` is returned since 21 August, and it is the idempotent case that
 * needs it.** A creation always lands as `want`, so the client could have assumed
 * that — but this is idempotent by §10, and a second tap on something already
 * listed returns the row that was there, which may be a go-back-to, a fixture or
 * archived. The film screen's tick points at the collection the entry is in, and
 * a guess would point at the wrong one exactly when the client's picture was
 * stale, which is the only time it is asking.
 */
export async function addFilmAction(
  input: AddFilmInput,
): Promise<ActionResult<{ entryId: string; created: boolean; state: EntryState }>> {
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

  /*
    The title is the text. A film chosen from a poster grid was never typed, so
    there are no words of the person's own to preserve — the name of the thing
    they picked is the honest reconstruction, and it is the same one the
    backfill made for every migrated row.
  */
  /*
    ⚠ **No `clientMutationId`, and that is a stated gap rather than an
    oversight.** §6 says every capture submission carries one; this submission
    does not, because the film flow has no client-side hold on a pending save
    to keep an id stable across a retry, and generating a fresh one per call
    would satisfy the letter of it while carrying nothing.

    What carries §10's idempotency here is the unique key on (user,
    possibility, intent): a film add always resolves a possibility first, so a
    retry collides and returns the existing row with `created: false`, and
    `fireOverlap` does not run on that conflict path, so there
    is no second notification either. (It *does* run when the conflict revives
    a crossed-off capture, which is a real change of state and not a retry —
    and it can only happen once, because the second attempt finds the row is a
    want again and takes the no-op path.) `tests/acceptance.test.ts` asserts both halves.

    ⚠ **This stops being true in Phase 1.** A raw capture has no possibility,
    so it has no key to collide with, and the mutation id becomes the only
    thing standing between a double-tap and two rows. Phase 1's exit criteria
    require it.
  */
  const result = await addCapture(sessionUser, {
    text: film.title,
    possibilityId: item.id,
    intent: parsed.data.intent,
  })

  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return {
    ok: true,
    value: {
      entryId: result.value.capture.id,
      created: result.value.created,
      state: result.value.capture.state,
    },
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

  const result = await resolveCapture(sessionUser, entryId, keep)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, value: null }
}

/**
 * The × on a want row, and the same × on a crossed-off one (§5.1 — a resolution,
 * not a delete). One action for the toggle, because one control drives it: a
 * pair of actions would let the client decide which direction it is going, and
 * the row's state already says.
 *
 * No rate limit: it writes to a row you already own and creates nothing, which is
 * what `entryCreate` guards.
 */
export async function crossOffAction(
  entryId: string,
  crossedOff: boolean,
): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!entryIdSchema.safeParse(entryId).success) {
    return { ok: false, message: 'Unknown entry.' }
  }

  const result = crossedOff
    ? await dropCapture(sessionUser, entryId)
    : await restoreCapture(sessionUser, entryId)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, value: null }
}

export async function undoEntryAction(entryId: string): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!entryIdSchema.safeParse(entryId).success) {
    return { ok: false, message: 'Unknown entry.' }
  }

  const result = await undoCapture(sessionUser, entryId)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, value: null }
}

/**
 * Copy a capture off someone else's page (§6). The id is theirs, not yours —
 * `copyCapture` resolves the possibility and the owner from it, and refuses
 * anything that is not shared with you, published, and held by a mutual.
 *
 * Rate limited on `entryCreate` rather than a bucket of its own: it creates an
 * entry, and the fact that the item came off someone's page does not make it a
 * different kind of write.
 */
export async function copyEntryAction(
  sourceEntryId: string,
): Promise<ActionResult<{ created: boolean }>> {
  const sessionUser = await requireSessionUser()

  if (!entryIdSchema.safeParse(sourceEntryId).success) {
    return { ok: false, message: 'Unknown entry.' }
  }

  for (const identifier of [sessionUser.id, clientIp(await headers())]) {
    const limit = await rateLimit('entryCreate', identifier)
    if (!limit.ok) return { ok: false, message: 'Slow down a moment.' }
  }

  const result = await copyCapture(sessionUser, sourceEntryId)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, value: { created: result.value.created } }
}

const noteSchema = z.string().max(NOTE_MAX)

/**
 * The private note. Zod bounds it here because §10 asks for a schema at every
 * boundary; the data layer checks the same length, and the two agree through
 * `NOTE_MAX` rather than by both spelling a number.
 */
export async function setEntryNoteAction(
  entryId: string,
  note: string,
): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!entryIdSchema.safeParse(entryId).success) {
    return { ok: false, message: 'Unknown entry.' }
  }
  if (!noteSchema.safeParse(note).success) {
    return { ok: false, message: `Keep it under ${NOTE_MAX} characters.` }
  }

  const result = await setCaptureNote(sessionUser, entryId, note)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, value: null }
}

/** v1 offers `see` and `own` for films, default first (§8). */
export async function filmIntents() {
  return intentsFor('film')
}
