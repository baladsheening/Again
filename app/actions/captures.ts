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
  acceptSuggestion,
  declineSuggestion,
  findMyCaptureByMutationId,
  getMyCaptureText,
  restoreCapture,
  searchMyCaptures,
  suggestForCapture,
  upsertPossibility,
  setCaptureText,
  undoCapture,
  PAGE_SIZE,
  SOURCE_URL_MAX,
  TEXT_MAX,
} from '@/lib/db'
import { dayStamper } from '@/lib/day'
 import { removeImage, storeImage } from '@/lib/media'
 import { searchFilms } from '@/lib/tmdb'
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
  /**
   * ⚠ **Optional, and a bad one never costs somebody their words.** It is
   * `.nullish()` rather than a required field and the layer below drops
   * anything that is not `http(s)` — so the failure mode of a mangled link is a
   * capture saved without one, never a capture refused. The words are the
   * capture; the link is context on it.
   *
   * ⚠ **This is the first of two checks, not the only one.** §10 asks for Zod
   * at every boundary and `lib/db/` is a boundary of its own: `cleanSourceUrl`
   * runs again inside the one writer, so a link that reaches a row has been
   * checked whichever action called. The scheme allowlist lives there because
   * that is the last place before the value becomes permanent.
   */
  sourceUrl: z.string().max(SOURCE_URL_MAX).nullish(),
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
    sourceUrl: parsed.data.sourceUrl,
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

/* -------------------------------------------------------------------------- */
/*  Resolution offers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * **Does this look like the same title?** — the confidence rule, and the whole
 * of it.
 *
 * ⚠ **A wrong offer is worse than no offer**, which is what makes this
 * conservative rather than clever. TMDB is a relevance match ranked by
 * popularity and it answers *something* for almost any string, so taking the
 * top result would put a film under every capture — *try pottery* would be
 * offered a thriller called *Pottery*, forever, on a line that was never about
 * a film. §13 requires that provider failure not lose a capture; a provider
 * *success* that is nonsense costs more, because it asks a question the person
 * has to dismiss.
 *
 * So the bar is that somebody typed the title and nothing else. **Exact match on
 * the reduced words**: *jaws*, *Jaws!*, *  JAWS  * all offer *Jaws*; *watch jaws
 * tonight* offers nothing. The misses are silent and cost nothing, which is the
 * right way round.
 *
 * ⚠ **This is deliberately NOT the normalising rule, and must never be used for
 * matching.** `normalised()` in `schema.ts` is the one implementation of *what
 * the words reduce to* and it lives in SQL, because rows and queries have to
 * agree forever. This decides only whether to *ask a question*: if the two ever
 * drift, an offer is made or not made, and nothing is stored under the wrong
 * reduction. Naming them apart is what keeps that true.
 */
function looksLikeTheSameTitle(a: string, b: string) {
  const reduce = (v: string) =>
    v
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
  const left = reduce(a)
  return left !== '' && left === reduce(b)
}

/**
 * **Offer a capture a possibility, after it is saved.**
 *
 * Saved → line → *then* a quiet offer, if there is one. §13: a capture is
 * complete when it is saved, an unresolved capture persisting is the ordinary
 * case, and nothing may be silently converted or matched.
 *
 * ⚠ **Provider failure is not an error state.** It is the absence of an offer —
 * logged and invisible. Every path out of here that is not *here is a
 * possibility* returns `{ offer: null }`, including a TMDB outage, a rate limit,
 * and a query that matched nothing. The page draws nothing, which is what it
 * draws for the overwhelming majority of captures anyway.
 *
 * ⚠ **It is asked once, at the moment of capture, and the answer is stored.**
 * Not on every page open: a record of fifty lines would be fifty provider calls
 * per open, and the offer would still be a different one each time. The row
 * carries the question so it can stand — see `suggested_possibility_id`.
 *
 * ⚠ **Only films, because only films have a provider.** The kind is not a guess
 * about the capture: it is the only catalogue the app has, and a capture that is
 * not about a film simply fails the title test above.
 */
export async function offerAction(
  captureId: string,
): Promise<ActionResult<{ offer: { title: string; year: number | null } | null }>> {
  const sessionUser = await requireSessionUser()

  if (!captureIdSchema.safeParse(captureId).success) {
    return { ok: false, message: 'Unknown capture.' }
  }

  /**
   * **No offer, and why — said to the log and to nobody else.**
   *
   * ⚠ **The design asks for this in those words**: provider failure is not an
   * error state, it is *the absence of an offer, logged and invisible*. The
   * invisible half was easy and the logged half is the half that matters — a
   * provider quietly answering nothing for a week looks exactly like a product
   * where captures do not resolve, and without a line in the log there is no
   * way to tell those apart.
   *
   * ⚠ **The words are not logged.** A capture is the most private thing in the
   * product; the reason an offer did not happen is operational, and the text
   * that would make the log useful for debugging is the text that would make it
   * a copy of everybody's diary.
   */
  const none = (why: string) => {
    console.warn(`offer: none (${why})`)
    return { ok: true, value: { offer: null } } as const
  }

  /*
    The words as they are stored, read back rather than taken from the client:
    the capture the offer attaches to is the one on the server, and its text may
    have been rewritten between the Return and this call.
  */
  const text = await getMyCaptureText(sessionUser, captureId)
  if (text === null) return none('no such capture')

  for (const identifier of [sessionUser.id, clientIp(await headers())]) {
    const limit = await rateLimit('search', identifier)
    /* A rate limit is the absence of an offer, not a message. */
    if (!limit.ok) return none('rate limited')
  }

  let results
  try {
    results = (await searchFilms(text, 1)).results
  } catch (e) {
    /*
      ⚠ **Swallowed on purpose, and this is the §13 requirement.** A provider
      being down must not reach the person who wrote the line: their capture is
      saved and complete, and an error on it would be the app reporting a
      failure of something it never promised. It is **logged**, which is the
      other half of the same requirement.
    */
    return none(`provider threw: ${e instanceof Error ? e.message : 'unknown'}`)
  }

  const match = results.find((r) => looksLikeTheSameTitle(text, r.title))
  if (!match) return none(`no title match in ${results.length} results`)

  const possibility = await upsertPossibility(sessionUser, {
    kind: 'film',
    externalSource: 'tmdb',
    externalId: match.externalId,
    title: match.title,
    year: match.year,
    metadata: { posterPath: match.posterPath },
  })

  const written = await suggestForCapture(sessionUser, captureId, possibility.id)
  /*
    `false` means the capture moved while this was in flight — resolved,
    already offered, or refused. The question belongs to the row, so the row's
    answer wins and nothing is drawn.
  */
  if (!written.ok || !written.value) return none('the row moved')

  return { ok: true, value: { offer: { title: possibility.title, year: possibility.year } } }
}

/** **Yes.** The suggestion becomes what the capture is about. */
export async function acceptOfferAction(captureId: string): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!captureIdSchema.safeParse(captureId).success) {
    return { ok: false, message: 'Unknown capture.' }
  }

  const result = await acceptSuggestion(sessionUser, captureId)
  if (!result.ok) return { ok: false, message: result.message }

  return { ok: true, value: null }
}

/**
 * **No.** This possibility is not the one.
 *
 * ⚠ **Not the same as ignoring**, which is why it is a mutation at all: an
 * unanswered offer stands indefinitely, and a question that expires on its own
 * has quietly answered itself.
 */
export async function declineOfferAction(captureId: string): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  if (!captureIdSchema.safeParse(captureId).success) {
    return { ok: false, message: 'Unknown capture.' }
  }

  const result = await declineSuggestion(sessionUser, captureId)
  if (!result.ok) return { ok: false, message: result.message }

  return { ok: true, value: null }
}

/* -------------------------------------------------------------------------- */
/*  Photographs                                                                */
/* -------------------------------------------------------------------------- */

/**
 * **A photograph is not a capture until it is captioned**, so this writes both
 * or neither.
 *
 * ⚠ **One call rather than an upload followed by a save**, and the reason is
 * orphans. An upload that returns a pathname before the capture exists leaves an
 * object in the store the moment somebody changes their mind — invisible,
 * unreferenced, and impossible to attribute later. Here the only object that
 * survives is one a row points at.
 *
 * ⚠ **Idempotency comes first, before the upload.** A retried submission finds
 * the capture already written and returns it **without storing a second copy of
 * the picture**. Uploading first and deduplicating after would put a megabyte in
 * the store for every resumed connection.
 *
 * ⚠ **It is slow and that is allowed.** Return does not wait: the line is on the
 * page before this is called, and the save goes out behind it — which is what
 * makes an upload on the same path as a capture acceptable at all.
 *
 * ⚠ **A failed write takes the object back out.** Best effort, because the
 * alternative to a failed delete is an object nothing can reach.
 */
export async function captureWithImageAction(
  form: FormData,
): Promise<ActionResult<{ id: string; created: boolean }>> {
  const sessionUser = await requireSessionUser()

  const parsed = captureSchema.safeParse({
    text: form.get('text'),
    clientMutationId: form.get('clientMutationId'),
    /*
      ⚠ **A missing field is `null`, and the schema is `.nullish()` for it.**
      `FormData.get` returns null for a key that was never set, which is exactly
      what *this capture has no link* means — so the caller omits the key rather
      than sending an empty string, and nothing has to special-case one.
    */
    sourceUrl: form.get('sourceUrl'),
  })
  if (!parsed.success) return { ok: false, message: 'Type something first.' }

  const image = form.get('image')
  if (!(image instanceof File)) return { ok: false, message: 'That photo did not arrive.' }

  for (const identifier of [sessionUser.id, clientIp(await headers())]) {
    const limit = await rateLimit('entryCreate', identifier)
    if (!limit.ok) return { ok: false, message: 'Slow down a moment.' }
  }

  /* The same submission again is the same capture, and the same photograph. */
  const already = await findMyCaptureByMutationId(sessionUser, parsed.data.clientMutationId)
  if (already) return { ok: true, value: { id: already.id, created: false } }

  const stored = await storeImage(sessionUser.id, image)
  if (!stored.ok) {
    return {
      ok: false,
      message:
        stored.reason === 'too-large'
          ? 'That photo is too big.'
          : stored.reason === 'wrong-type'
            ? 'That is not a photo this can keep.'
            : 'That photo did not arrive.',
    }
  }

  const result = await addCapture(sessionUser, {
    text: parsed.data.text,
    clientMutationId: parsed.data.clientMutationId,
    imagePath: stored.path,
    sourceUrl: parsed.data.sourceUrl,
  })

  if (!result.ok) {
    await removeImage(stored.path)
    return { ok: false, message: result.message }
  }

  return { ok: true, value: { id: result.value.capture.id, created: result.value.created } }
}
