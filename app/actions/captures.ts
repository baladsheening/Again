'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import {
  addCapture,
  dropCapture,
  listMyPage,
  pageCursor,
  parsePageCursor,
  requireSessionUser,
  resolveCapture,
  restoreCapture,
  searchMyCaptures,
  setCaptureText,
  undoCapture,
  PAGE_SIZE,
  TEXT_MAX,
} from '@/lib/db'
import { dayStamper } from '@/lib/day'
import { toPageLines, type PageLineView } from '@/lib/page-line'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { viewerTimeZone } from '@/lib/region'
import type { ActionResult } from './entries'

/**
 * The page's mutations. Thin, delegating to `lib/db/` (§3), with auth
 * re-verified inside each one because a Server Action is a separate entry point
 * and a page-level check does not cover it.
 *
 * ⚠ **Nothing here calls `refresh()`, and that is the deliberate difference
 * from `entries.ts`.** The whole design of this phase is that capture is
 * instant: Return commits the line, drops the caret to a fresh one, and the save
 * goes out behind it. A router refresh on every Return would re-render the tree
 * on the server per line — a round trip standing between somebody and their next
 * word — and the page would then be told its own list twice, once optimistically
 * and once authoritatively, which is a flicker on a screen whose whole promise
 * is that it behaves like paper.
 *
 * **The page owns its list for the length of the session** and reads the server
 * again on the next load. See `components/page-screen.tsx`.
 */

/**
 * ⚠ **The stable client mutation id, and it is the one thing §13 required of
 * this phase that Phase 0 could not ship.**
 *
 * Phase 0's idempotency was the unique key on (user, possibility, intent): a
 * film add resolves a possibility first, so a retry collides and returns the
 * existing row. **A raw capture has no such key** — two captures of the same
 * words are legitimately two captures — so with nothing else, a double-tapped
 * Return or a resumed connection writes a second line.
 *
 * The id is minted on the client, once, when the line is committed, and it is
 * held with the pending line so that a retry carries the *same* id rather than a
 * fresh one. That is the whole of it: generating one per call would satisfy the
 * letter of §6 and carry nothing.
 *
 * It costs no column — `captures.client_mutation_id` and the unique key on
 * (user, id) have been in the schema since Phase 0, waiting for a writer.
 */
const captureSchema = z.object({
  text: z.string().trim().min(1).max(TEXT_MAX),
  clientMutationId: z.string().uuid(),
})

export type CaptureInput = z.infer<typeof captureSchema>

/**
 * Save one line.
 *
 * ⚠ **A capture is complete when it is saved.** No provider is consulted, no
 * catalogue is matched, and nothing is asked of the person who wrote it — §13
 * forbids a forced search or catalogue match before a capture can be saved, and
 * an unresolved capture persisting is the ordinary case rather than a degraded
 * one. A resolution may be offered afterwards; ignoring it leaves the capture
 * raw, permanently and legitimately.
 */
export async function captureAction(
  input: CaptureInput,
): Promise<ActionResult<{ id: string; createdAt: string; created: boolean }>> {
  const sessionUser = await requireSessionUser()

  const parsed = captureSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Type something first.' }

  for (const identifier of [sessionUser.id, clientIp(await headers())]) {
    const limit = await rateLimit('entryCreate', identifier)
    if (!limit.ok) return { ok: false, message: 'Slow down a moment.' }
  }

  const result = await addCapture(sessionUser, {
    text: parsed.data.text,
    clientMutationId: parsed.data.clientMutationId,
  })

  if (!result.ok) return { ok: false, message: result.message }

  return {
    ok: true,
    value: {
      id: result.value.capture.id,
      /*
        The server's clock, not the client's. The line was drawn optimistically
        against `Date.now()`, and the day stamp it lands under has to be the one
        the next cold open computes from this column, or a capture written near
        midnight moves group when the page is reloaded.
      */
      createdAt: result.value.capture.createdAt.toISOString(),
      created: result.value.created,
    },
  }
}

const captureIdSchema = z.string().uuid()

/**
 * The ×, both ways. A resolution, not a delete (§5.1) — the row stays where it
 * is, struck through and dimmed, and the same × puts it back.
 *
 * One action for the toggle, because one control drives it: a pair would let
 * the client decide which direction it is going, and the row's state already
 * says.
 */
export async function crossOffCaptureAction(
  captureId: string,
  crossedOff: boolean,
): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!captureIdSchema.safeParse(captureId).success) {
    return { ok: false, message: 'Unknown capture.' }
  }

  const result = crossedOff
    ? await dropCapture(sessionUser, captureId)
    : await restoreCapture(sessionUser, captureId)
  if (!result.ok) return { ok: false, message: result.message }

  return { ok: true, value: null }
}

/**
 * Settle a capture: it leaves the page for the tray.
 *
 * ⚠ **One question, and the question is *Again?*** `resolveCapture` needs an
 * answer because the two outcomes are genuinely different claims — *I would do
 * this again* against *that is dealt with* — and no property of a raw capture
 * can supply one. `specFor` cannot: it needs a type and an intention, and a raw
 * capture has neither, which is the empty case this phase had to answer for.
 *
 * The word generalises where the film-first *Go back?* did not: a film you would
 * watch again, a place you would go again, a class you would take again. It is
 * also the app's own name, which is the argument for keeping the distinction
 * rather than settling everything into `done` and quietly retiring it.
 *
 * `keep` therefore lands in `go_back_to` — **Again** — and `!keep` in `done`.
 */
export async function settleCaptureAction(
  captureId: string,
  again: boolean,
): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!captureIdSchema.safeParse(captureId).success) {
    return { ok: false, message: 'Unknown capture.' }
  }

  const result = await resolveCapture(sessionUser, captureId, again)
  if (!result.ok) return { ok: false, message: result.message }

  return { ok: true, value: null }
}

const editSchema = z.object({
  captureId: z.string().uuid(),
  text: z.string().trim().min(1).max(TEXT_MAX),
})

/**
 * Rewrite a line's words.
 *
 * ⚠ **No client mutation id, and the asymmetry with `captureAction` is the
 * point.** Creation needed one because a raw capture has no natural key — two
 * captures of the same words are legitimately two captures, so a retried Return
 * writes a second line unless something says *this is the same submission*. An
 * edit names the row it is editing, so a retry writes the same words to the same
 * row and §10's idempotency comes free. Adding an id here would be ceremony.
 *
 * ⚠ **Rate-limited on the same bucket as creation.** An edit is a write of the
 * same shape and cost, and a per-mutation bucket would mean a limit somebody can
 * step around by alternating between two of them.
 */
export async function editCaptureAction(
  captureId: string,
  text: string,
): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  const parsed = editSchema.safeParse({ captureId, text })
  if (!parsed.success) return { ok: false, message: 'That will not save.' }

  for (const identifier of [sessionUser.id, clientIp(await headers())]) {
    const limit = await rateLimit('entryCreate', identifier)
    if (!limit.ok) return { ok: false, message: 'Slow down a moment.' }
  }

  const result = await setCaptureText(sessionUser, parsed.data.captureId, parsed.data.text)
  if (!result.ok) return { ok: false, message: result.message }

  return { ok: true, value: null }
}

/**
 * Undo, in the bar, and it **deletes** — the single exception to §5.1's
 * *nothing is ever deleted*, for a line that should never have existed.
 * Afterwards there is no record that it did.
 *
 * ⚠ **Not the same gesture as the ×**, which writes `dropped`: a resolution, for
 * an intention that lapsed. The window is what keeps them apart — `undoCapture`
 * bounds it in SQL against `created_at` rather than trusting a client's word for
 * how long ago the line landed, and refuses anything already resolved.
 */
export async function undoCaptureAction(captureId: string): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!captureIdSchema.safeParse(captureId).success) {
    return { ok: false, message: 'Unknown capture.' }
  }

  const result = await undoCapture(sessionUser, captureId)
  if (!result.ok) return { ok: false, message: result.message }

  return { ok: true, value: null }
}

/**
 * **Earlier: the next slice of the record, older than the last line on screen.**
 *
 * The first read is fifty lines, which is roughly a month of this, and before
 * this existed nothing reached past them.
 *
 * ⚠ **A read, so it delegates and stamps and does nothing else.** It writes
 * nothing, so there is no rate limit and no mutation id: the worst a loop of
 * these can do is read a person their own record, which is what the page is for.
 * §3 still holds — the query is `listMyPage`, which filters on the session user.
 *
 * ⚠ **The stamps are computed here, and that is not a duplicate of the route.**
 * Both call `toPageLines` with a stamper built from the viewer's timezone, so a
 * line fetched by this and a line rendered by the route agree about which day
 * they belong to. Formatting on the client instead would put the browser's
 * timezone against the server's and disagree about how many day groups there
 * are — see `lib/day.ts`.
 *
 * ⚠ **A bad cursor reads the first page rather than failing.** `parsePageCursor`
 * returns `null` for anything malformed and the query then carries no predicate;
 * the client would see lines it already has, which is visible and harmless,
 * where a 500 on a scroll is neither.
 */
export async function earlierAction(
  cursor: string,
): Promise<ActionResult<{ lines: PageLineView[]; earlier: string | null }>> {
  const sessionUser = await requireSessionUser()

  const parsed = z.string().min(3).max(120).safeParse(cursor)
  if (!parsed.success) return { ok: false, message: 'Could not read further back.' }

  const before = parsePageCursor(parsed.data)
  if (!before) return { ok: false, message: 'Could not read further back.' }

  /* One past the slice, so the answer carries whether there is another. */
  const rows = await listMyPage(sessionUser, { limit: PAGE_SIZE + 1, before })
  const more = rows.length > PAGE_SIZE
  const shown = more ? rows.slice(0, PAGE_SIZE) : rows

  const { stamp } = dayStamper(new Date(), (await viewerTimeZone()) ?? undefined)

  return {
    ok: true,
    value: {
      lines: toPageLines(shown, stamp),
      earlier: more && shown.length > 0 ? pageCursor(shown[shown.length - 1]) : null,
    },
  }
}

/**
 * **Search over the record — live, crossed off and settled.**
 *
 * ⚠ **A read, like `earlierAction`**: it delegates, stamps, and writes nothing.
 * No rate limit and no mutation id; the worst a loop of these does is read
 * somebody their own record. §3 holds because `searchMyCaptures` filters on the
 * session user, which is also what makes it safe for it to see `done` (§5.3).
 *
 * ⚠ **An empty needle is refused here rather than in SQL.** Normalising a query
 * of pure punctuation gives the empty string, and `LIKE '%%'` matches every row
 * — *nothing to search for* answered with *everything*. The guard is a
 * deliberately loose "is there a letter or a digit in this at all", **not** a
 * second copy of the normalising rule: the rule lives in `schema.ts` and is
 * applied in SQL, and this only decides whether to ask.
 */
const searchSchema = z.object({
  q: z.string().trim().min(1).max(TEXT_MAX),
  cursor: z.string().min(3).max(120).nullable(),
})

export async function searchAction(
  input: z.infer<typeof searchSchema>,
): Promise<ActionResult<{ lines: PageLineView[]; earlier: string | null }>> {
  const sessionUser = await requireSessionUser()

  const parsed = searchSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Type something to look for.' }

  /* Nothing to look for: an answer, not an error, and not every row. */
  if (!/[\p{L}\p{N}]/u.test(parsed.data.q)) {
    return { ok: true, value: { lines: [], earlier: null } }
  }

  const before = parsed.data.cursor ? parsePageCursor(parsed.data.cursor) : undefined
  const rows = await searchMyCaptures(sessionUser, {
    q: parsed.data.q,
    limit: PAGE_SIZE + 1,
    before: before ?? undefined,
  })
  const more = rows.length > PAGE_SIZE
  const shown = more ? rows.slice(0, PAGE_SIZE) : rows

  const { stamp } = dayStamper(new Date(), (await viewerTimeZone()) ?? undefined)

  return {
    ok: true,
    value: {
      lines: toPageLines(shown, stamp),
      earlier: more && shown.length > 0 ? pageCursor(shown[shown.length - 1]) : null,
    },
  }
}
