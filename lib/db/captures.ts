import 'server-only'

import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import { alias, type PgColumn } from 'drizzle-orm/pg-core'

import { db } from './client'
import {
  captures,
  normalised,
  possibilities,
  profiles,
  tracks,
  type Capture,
  type CaptureState,
  type Possibility,
} from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'
import { runOverlap } from '@/lib/overlap'
import { DEFAULT_INTENT, specFor } from '@/lib/vocabulary'
import { PUBLIC_STATES, SHARED_SCOPES } from '@/lib/domain'
import type { CaptureSource, Intent, Kind, Visibility } from '@/lib/domain'

/**
 * The capture layer. **From Phase 0 on this is the only thing that writes a
 * user's intentions** — `entries` is read-only, kept while the backfill is
 * verified against it, and every function here replaces a counterpart there.
 *
 * The differences from `entries.ts` are not stylistic. A capture is valid with
 * no possibility and no intention, so every join to `possibilities` is a LEFT
 * join and every read of `intent` has to survive a null. And another person's
 * captures are reached through four positive terms rather than one, which is
 * the whole of the visibility model.
 */

/** §5 views, unchanged. `archive` is deliberately absent from `SharedView`. */
export type OwnerView = 'live' | 'go_back_tos' | 'fixtures' | 'archive'
export type SharedView = 'live' | 'go_back_tos' | 'fixtures'

/** A capture, and the canonical thing it resolved to — if it resolved to one. */
export type CaptureWithPossibility = {
  capture: Capture
  possibility: Possibility | null
}

/**
 * What another person's capture may be.
 *
 * ⚠ **Named columns, never `captures`.** `select({ capture: captures })`
 * returns whatever the table happens to hold, so the day a private column is
 * added it is already in every shared read — nothing fails, nothing looks
 * wrong, and the guarantee is gone. `note` is that column today. Listing the
 * shared ones by hand means a new private field is excluded by default rather
 * than by memory.
 *
 * Adding a column here is a decision to publish it. Do not spread `captures`.
 */
const SHARED_CAPTURE_COLUMNS = {
  id: captures.id,
  userId: captures.userId,
  possibilityId: captures.possibilityId,
  text: captures.text,
  intent: captures.intent,
  state: captures.state,
  returnCount: captures.returnCount,
  source: captures.source,
  sourceUserId: captures.sourceUserId,
  createdAt: captures.createdAt,
  resolvedAt: captures.resolvedAt,
} as const

export type SharedCapture = {
  [K in keyof typeof SHARED_CAPTURE_COLUMNS]: Capture[K]
}

export type SharedCaptureWithPossibility = {
  capture: SharedCapture
  possibility: Possibility | null
}

/**
 * What a list row needs and nothing else (§10). The text is the row; the
 * possibility fields are null until something canonical is attached, which is
 * the ordinary state of a capture rather than a degraded one.
 */
export type CaptureCard = {
  id: string
  text: string
  intent: Intent | null
  state: CaptureState
  kind: Kind | null
  title: string | null
  year: number | null
  posterPath: string | null
}

/** Takes the shared shape, so it cannot be the thing that carries `note` out. */
export function toCaptureCard({
  capture,
  possibility,
}: SharedCaptureWithPossibility): CaptureCard {
  const metadata = (possibility?.metadata ?? {}) as { posterPath?: string | null }
  return {
    id: capture.id,
    text: capture.text,
    intent: capture.intent,
    state: capture.state,
    kind: possibility?.kind ?? null,
    title: possibility?.title ?? null,
    year: possibility?.year ?? null,
    posterPath: metadata.posterPath ?? null,
  }
}

/**
 * §10: paginate every list.
 *
 * ⚠ **Exported, because the page asks for `PAGE_SIZE + 1`.** One row past the
 * slice is how a read answers *is there more* without a second query and
 * without a count — and the caller can only do that arithmetic if it is looking
 * at the same number this file is.
 */
export const PAGE_SIZE = 50

/** §10: paginate every list. */
export type Page = { limit?: number; offset?: number }

function stateFilter(view: OwnerView) {
  switch (view) {
    /*
      A go-back-to is still a want (§5.2), and a crossed-off want stays on the
      page struck through — safe here only because the shared read filters on
      `PUBLIC_STATES` as well. See `listEntriesForOtherUser` for the full note;
      the inversion it describes is what makes widening this view safe.
    */
    case 'live':
      return inArray(captures.state, ['want', 'go_back_to', 'dropped'] as const)
    case 'go_back_tos':
      return eq(captures.state, 'go_back_to' as const)
    case 'fixtures':
      return eq(captures.state, 'fixture' as const)
    case 'archive':
      return eq(captures.state, 'done' as const)
  }
}

function orderFor(view: OwnerView) {
  if (view === 'go_back_tos') return [desc(captures.resolvedAt)]

  /*
    The CASE names `go_back_to` rather than `want`, so crossing a row off leaves
    it where it was. The reasoning is in `entries.ts` and carries over
    unchanged: it is a fact about what striking a row through means, not about
    which table the row lives in.
  */
  if (view === 'live') {
    return [
      asc(sql`case when ${captures.state} = 'go_back_to' then 1 else 0 end`),
      desc(captures.createdAt),
    ]
  }

  return [desc(captures.createdAt)]
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                      */
/* -------------------------------------------------------------------------- */

/** The caller's own captures, every view, private states included (§5.3). */
export async function listMyCaptures(
  sessionUser: SessionUser,
  view: OwnerView,
  { limit = PAGE_SIZE, offset = 0 }: Page = {},
): Promise<CaptureWithPossibility[]> {
  return db
    .select({ capture: captures, possibility: possibilities })
    .from(captures)
    /* LEFT, because a capture with nothing canonical behind it is the norm. */
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .where(and(eq(captures.userId, sessionUser.id), stateFilter(view)))
    .orderBy(...orderFor(view))
    .limit(limit)
    .offset(offset)
}

/** One grouped statement, not four counts — the note in `entries.ts` applies. */
export async function countMyCaptures(
  sessionUser: SessionUser,
): Promise<Record<OwnerView, number>> {
  const rows = await db
    .select({ state: captures.state, count: sql<number>`count(*)::int` })
    .from(captures)
    .where(eq(captures.userId, sessionUser.id))
    .groupBy(captures.state)

  const byState = new Map(rows.map((r) => [r.state, r.count]))
  const n = (state: CaptureState) => byState.get(state) ?? 0

  return {
    live: n('want') + n('go_back_to'),
    go_back_tos: n('go_back_to'),
    fixtures: n('fixture'),
    archive: n('done'),
  }
}

/**
 * Another person's captures.
 *
 * **Four positive terms, all required, and none of them derived from a
 * caller.** A capture reaches this projection only when its scope is shared,
 * the track is mutual in both directions, and its state is published. The
 * mutuality is two INNER JOINs rather than a flag, so a missing track row
 * removes every candidate: the query returns nothing when the relationship is
 * not there, which is the direction it has to fail in.
 *
 * ⚠ **Non-mutuals get nothing, and the caller must not render that as an empty
 * list.** *This person has nothing* and *this person has nothing for you* are
 * different claims, and the first is one the app has no business making about
 * somebody else. The page says the list is not shared, unconditionally,
 * whether the owner holds a thousand captures or none.
 *
 * ⚠ Do not add an `includeArchive` flag. Do not add a scope parameter. Do not
 * rely on callers passing the right filter. This is one of the places where a
 * silent bug damages trust rather than function (§13).
 */
export async function listCapturesForOtherUser(
  viewer: SessionUser,
  targetUserId: string,
  view: SharedView,
  { limit = PAGE_SIZE, offset = 0 }: Page = {},
): Promise<SharedCaptureWithPossibility[]> {
  const outbound = alias(tracks, 'outbound')
  const inbound = alias(tracks, 'inbound')

  return db
    .select({ capture: SHARED_CAPTURE_COLUMNS, possibility: possibilities })
    .from(captures)
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .innerJoin(
      outbound,
      and(eq(outbound.followerId, viewer.id), eq(outbound.followedId, targetUserId)),
    )
    .innerJoin(
      inbound,
      and(eq(inbound.followerId, targetUserId), eq(inbound.followedId, viewer.id)),
    )
    .where(
      and(
        eq(captures.userId, targetUserId),
        /*
          The fourth term, and it is here rather than in an early return
          because control flow is what gets refactored away. It is also not
          implied by the joins: nothing stops a `tracks` row from naming the
          same person twice, and a self-track would satisfy both of them.
        */
        ne(captures.userId, viewer.id),
        /* Unconditional, all of them. None is derived from `view`. */
        inArray(captures.visibility, SHARED_SCOPES),
        inArray(captures.state, PUBLIC_STATES),
        stateFilter(view),
      ),
    )
    .orderBy(...orderFor(view))
    .limit(limit)
    .offset(offset)
}

/**
 * What this user already holds for one catalogue item, named the way the
 * catalogue names it. The film screen is the caller.
 *
 * Owner-only, and deliberately includes `done` and `dropped` — the reasoning
 * in `listMyEntriesForExternalId` carries over unchanged.
 */
export type ListedCapture = {
  captureId: string
  intent: Intent | null
  state: CaptureState
}

export async function listMyCapturesForExternalId(
  sessionUser: SessionUser,
  input: { kind: Kind; externalId: string },
): Promise<ListedCapture[]> {
  const rows = await db
    .select({ id: captures.id, intent: captures.intent, state: captures.state })
    .from(captures)
    .innerJoin(possibilities, eq(captures.possibilityId, possibilities.id))
    .where(
      and(
        eq(captures.userId, sessionUser.id),
        eq(possibilities.kind, input.kind),
        eq(possibilities.externalId, input.externalId),
      ),
    )
    .limit(8)

  return rows.map((r) => ({ captureId: r.id, intent: r.intent, state: r.state }))
}

/**
 * §6's fan-out.
 *
 * ⚠ **One rule decides every call site: it runs when a capture becomes a
 * signal it was not already, and never merely because a writer touched the
 * row.** Three moments qualify — a capture created shared, a state change, and
 * a scope moving into `SHARED_SCOPES`. Two deliberately do not: reviving a
 * crossed-off capture and restoring one, because dropping never withdrew the
 * notification it had already sent, so coming back announces nothing new.
 *
 * Overlap does not deduplicate. Every avoidable re-fire is a second identical
 * row at somebody, which is why the rule lives here in one sentence rather
 * than as a judgement made separately at each caller.
 *
 * ⚠ **Three guards, and each of them is a reason there is nothing to fan out
 * rather than an optimisation.** A capture that resolved to nothing has no
 * canonical thing to converge on — that is the Phase 2 possible-match path,
 * which reads `normalised_text` and is not this. A capture with no intention
 * cannot be classified, because `classify` decides on the pair of intents. And
 * **a private capture is not a signal to anybody**: convergence is two people
 * who have each shared an intention, so fanning out from an unshared one would
 * notify someone about a list its owner never opened.
 *
 * ⚠ The counterpart side carries the same three conditions in SQL. Both halves
 * are needed: this one stops the query, that one filters its result.
 */
async function fireOverlap(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  sessionUser: SessionUser,
  capture: Capture,
) {
  if (!capture.possibilityId) return
  if (!capture.intent) return
  if (!(SHARED_SCOPES as readonly string[]).includes(capture.visibility)) return

  // `displayName` as well as the handle: notifications only cross mutual
  // tracks, which is the condition §5 attaches names to — see `nameFor`.
  const [me] = await tx
    .select({ handle: profiles.handle, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, sessionUser.id))
    .limit(1)

  const [possibility] = await tx
    .select({ id: possibilities.id, title: possibilities.title })
    .from(possibilities)
    .where(eq(possibilities.id, capture.possibilityId))
    .limit(1)

  if (!me || !possibility) return

  await runOverlap(
    tx,
    {
      userId: capture.userId,
      handle: me.handle,
      displayName: me.displayName,
      intent: capture.intent,
      state: capture.state,
      source: capture.source,
      sourceUserId: capture.sourceUserId,
    },
    possibility,
  )
}

/* -------------------------------------------------------------------------- */
/*  The page (Phase 1)                                                        */
/* -------------------------------------------------------------------------- */

/**
 * What is on the landing page: everything live, and nothing settled.
 *
 * ⚠ **Two states, positive, and it is not `OwnerView.live`.** That view is
 * `want, go_back_to, dropped` — it carries go-back-tos because the film-first
 * collections list a go-back-to among the wants. The page does not: **settled
 * captures leave the page**, which is the largest single reduction available for
 * reading back and it costs nothing new. A go-back-to is settled — it is
 * *Again*, in the tray.
 *
 * A crossed-off capture stays, struck through, in the position it held. That is
 * the whole design of the ×, and it is the reason `dropped` is here beside
 * `want` rather than in the tray with the resolutions.
 */
const PAGE_STATES = ['want', 'dropped'] as const satisfies readonly CaptureState[]

/**
 * One line of the page. Named columns, like everything shared here — a `select`
 * of the whole table is how `note` reaches a client the day somebody adds a
 * column, and this shape crosses into a Client Component.
 *
 * `year` is the only thing a resolved line says beyond its own text. §3's types
 * and intentions exist for a resolved capture and for no other, and most lines
 * are raw — so the derivation that has to answer for `(undefined, undefined)`
 * answers by saying nothing at all, which is what this shape encodes.
 */
export type PageLine = {
  id: string
  text: string
  state: CaptureState
  year: number | null
  createdAt: Date
  /**
   * **A question standing on this line**, or `null` — which is the ordinary
   * case and always will be.
   *
   * ⚠ **Derived in the read, not exposed as three columns.** Whether an offer
   * stands is *suggested, and not yet resolved, and not refused* — three facts
   * that only mean something together. Handing the client the parts would let a
   * screen invent a fourth reading of them, and the one that matters is
   * whether to draw a `?`.
   */
  offer: { title: string; year: number | null } | null
}

/**
 * A place in the record, for reading past the first page.
 *
 * ⚠ **A cursor, not an offset, and the reason is that the record has a live
 * head.** `offset: 50` means *skip fifty rows as they are ordered now* — and a
 * capture written during the session, or a line crossed off, changes what row
 * fifty is. Every line typed since the page loaded would push one seeded line
 * back into the next slice, so *Earlier* would hand back lines already on
 * screen. A cursor names a place instead of counting to it, and insertions at
 * the head cannot move a place.
 *
 * It is opaque to the client, which only ever passes it back.
 */
export type PageCursor = { createdAt: Date; id: string }

const CURSOR_SEP = '|'

/** The place *after* a line — i.e. where the next, earlier slice starts. */
export function pageCursor(line: PageLine): string {
  return `${line.createdAt.toISOString()}${CURSOR_SEP}${line.id}`
}

/**
 * ⚠ **Returns `null` rather than throwing on anything malformed.** A cursor
 * arrives from a client, so it is input: a bad one is a read of the first page,
 * never a 500 and never an unbounded scan.
 */
export function parsePageCursor(raw: string): PageCursor | null {
  const at = raw.indexOf(CURSOR_SEP)
  if (at < 1) return null
  const createdAt = new Date(raw.slice(0, at))
  const id = raw.slice(at + 1)
  if (Number.isNaN(createdAt.getTime()) || id === '') return null
  return { createdAt, id }
}

/**
 * The page, newest first — **and the page uses it that way.**
 *
 * ⚠ **The record is newest-first**: the caret is under the bar and every capture
 * pushes the record down, so the order this query returns is the order the page
 * wants and nothing reverses it. §10 requires every list to be paginated, and a
 * page of a two-hundred-line record has to be *the most recent* fifty rather
 * than the first fifty ever written — an ascending `limit` would open the app on
 * something typed in March.
 *
 * ⚠ **This comment said "and the caller reverses it" until 24 August**, from
 * the fortnight the page was written downward. The handset reversed the order
 * and the caller stopped reversing; the query never changed.
 *
 * `before` walks backwards into the record, which is the direction *earlier*
 * means here. It is the same `(createdAt, id)` pair the ordering uses, so the
 * predicate and the sort cannot disagree about where a slice ends.
 *
 * The tie-break on `id` is not decoration: two captures saved in the same
 * millisecond otherwise have no defined order, and a row that changes places
 * between two pages is a row that can be shown twice or not at all.
 */
export async function listMyPage(
  sessionUser: SessionUser,
  { limit = PAGE_SIZE, before }: { limit?: number; before?: PageCursor } = {},
): Promise<PageLine[]> {
  /*
    ⚠ **The second join is the *question*, and it is a different column.** A
    capture's possibility is what it resolved to; its suggestion is what it was
    offered. Joining one alias to both would collapse the two into whichever
    happened to be set, which is precisely the confusion
    `suggested_possibility_id` is documented against.
  */
  const suggested = alias(possibilities, 'suggested')

  const rows = await db
    .select({
      id: captures.id,
      text: captures.text,
      state: captures.state,
      year: possibilities.year,
      createdAt: captures.createdAt,
      resolved: captures.possibilityId,
      declinedAt: captures.resolutionDeclinedAt,
      offerTitle: suggested.title,
      offerYear: suggested.year,
    })
    .from(captures)
    /* LEFT, because a capture with nothing canonical behind it is the norm. */
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .leftJoin(suggested, eq(suggested.id, captures.suggestedPossibilityId))
    .where(
      and(
        eq(captures.userId, sessionUser.id),
        inArray(captures.state, PAGE_STATES),
        /*
          Strictly past the cursor, in the same order the sort uses: an earlier
          instant, or the same instant and a lower id. `and()` drops the
          `undefined`, so the first page carries no predicate at all.
        */
        before
          ? or(
              lt(captures.createdAt, before.createdAt),
              and(eq(captures.createdAt, before.createdAt), lt(captures.id, before.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(captures.createdAt), desc(captures.id))
    .limit(limit)

  return rows.map(({ resolved, declinedAt, offerTitle, offerYear, ...line }) => ({
    ...line,
    /*
      *Suggested, and not yet resolved, and not refused.* All three, or there is
      no question to draw — see `PageLine.offer`.
    */
    offer:
      offerTitle !== null && resolved === null && declinedAt === null
        ? { title: offerTitle, year: offerYear }
        : null,
  }))
}

/**
 * The tray: everything settled, in one read.
 *
 * **Three states, and whether they are one surface or three is still open** —
 * the states stay distinct either way, so this returns them distinguished and
 * lets the surface decide. `resolvedAt` orders it, because the interesting
 * moment for something settled is when it was settled and not when it was first
 * written down.
 */
export async function listMySettled(
  sessionUser: SessionUser,
  { limit = PAGE_SIZE, offset = 0 }: Page = {},
): Promise<PageLine[]> {
  /*
    ⚠ **No offer, and it is a `null` written down rather than a join left
    out.** A settled capture is one somebody is done deciding about; a question
    on it would be the app asking about something already answered. The tray
    has no way to answer one either.
  */
  return db
    .select({
      id: captures.id,
      text: captures.text,
      state: captures.state,
      year: possibilities.year,
      createdAt: captures.createdAt,
      offer: sql<null>`null`,
    })
    .from(captures)
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .where(
      and(
        eq(captures.userId, sessionUser.id),
        inArray(captures.state, ['go_back_to', 'fixture', 'done'] as const),
      ),
    )
    .orderBy(desc(captures.resolvedAt), desc(captures.id))
    .limit(limit)
    .offset(offset)
}

/**
 * **Everything the words are in — live, crossed off, and settled.**
 *
 * ⚠ **No state filter, and that is the point of the surface.** *Where is that
 * thing I wrote in June* is usually something already dealt with, so a search
 * that only saw the page would miss the case it exists for. The page's own read
 * is `PAGE_STATES`, the tray's is the settled three, and this is the union —
 * which is also why search cannot be a filter over the page's list and has to be
 * a read of its own.
 *
 * ⚠ **`done` is private (§5.3), and it is in here.** That is safe for exactly
 * one reason: this filters on `sessionUser.id`, so the only person who can reach
 * a `done` row through it is the person who wrote it. **Nothing derived from
 * this may be handed to anyone else** — there is no shared search, and adding
 * one is not a parameter on this function.
 *
 * ⚠ **The query is normalised by the same rule as the column, in SQL.** Not by
 * a TypeScript copy: `normalised` is the single implementation, applied to the
 * parameter on its way in, so a change to the rule moves the rows and the
 * queries together. See its note in `schema.ts`.
 *
 * ⚠ **A substring match, not a prefix and not full text.** A person looking for
 * a line they wrote remembers a word from the middle of it as readily as the
 * first, so `LIKE 'q%'` answers the wrong question — and Postgres full-text
 * would bring stemming and a dictionary, which are language choices this product
 * has not made and would silently mis-serve every capture written in a script
 * the dictionary does not cover. The index that carries the cost is
 * `captures_user_created_idx`: the user's own rows, newest first, bounded by
 * `limit` (§10). Somebody's whole record is a few hundred lines.
 *
 * ⚠ **An empty needle is the caller's problem, not this one's.** Normalising a
 * query of pure punctuation gives the empty string, and `LIKE '%%'` matches
 * every row — which would answer *nothing to search for* with *everything*. The
 * action refuses it before it gets here.
 */
export async function searchMyCaptures(
  sessionUser: SessionUser,
  { q, limit = PAGE_SIZE, before }: { q: string; limit?: number; before?: PageCursor },
): Promise<PageLine[]> {
  /*
    ⚠ **No offer here either.** Search results are read-only — nothing on that
    surface acts on a line — so a `?` would be a question with no way to answer
    it, which is worse than not asking.
  */
  return db
    .select({
      id: captures.id,
      text: captures.text,
      state: captures.state,
      year: possibilities.year,
      createdAt: captures.createdAt,
      offer: sql<null>`null`,
    })
    .from(captures)
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .where(
      and(
        eq(captures.userId, sessionUser.id),
        sql`${captures.normalisedText} LIKE '%' || ${normalised(sql`${q}`)} || '%'`,
        before
          ? or(
              lt(captures.createdAt, before.createdAt),
              and(eq(captures.createdAt, before.createdAt), lt(captures.id, before.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(captures.createdAt), desc(captures.id))
    .limit(limit)
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/** How long a freshly created capture can be taken back (§5.1). */
export const UNDO_WINDOW_MS = 10_000

/** §10 bounds it at the boundary; this is the same number, owned here. */
export const NOTE_MAX = 140

export const TEXT_MAX = 280

/**
 * Everything a caller may say about a new capture.
 *
 * ⚠ **Provenance is deliberately absent, and a comment saying "server-supplied
 * only" is not what keeps it absent — this type is.** The three source columns
 * are the input to §6's suppression rule, so a caller that can name its own
 * provenance can switch suppression off and turn copying somebody's list into
 * a way of notifying them. An optional field on a public input type reaches a
 * request body the first time someone spreads a parsed object into it.
 */
export type AddCaptureInput = {
  text: string
  possibilityId?: string | null
  intent?: Intent | null
  /** §6: the same id retried is the same capture, not a second one. */
  clientMutationId?: string | null
}

/**
 * How a capture came to exist. **Private to this module**, which is the whole
 * of its enforcement: `writeCapture` is not exported, so the only two things
 * that can supply one are `addCapture` — which always supplies `OWN` — and
 * `copyCapture`, which reads it off the row being copied.
 */
type CaptureProvenance = {
  source: CaptureSource
  sourceUserId: string | null
  sourceCaptureId: string | null
}

const OWN: CaptureProvenance = {
  source: 'self',
  sourceUserId: null,
  sourceCaptureId: null,
}

/**
 * Save a capture. The only public way to create one, and it is always your
 * own: provenance comes from `OWN` and cannot be reached from here.
 */
export async function addCapture(
  sessionUser: SessionUser,
  input: AddCaptureInput,
): Promise<Result<{ capture: Capture; created: boolean }>> {
  return writeCapture(sessionUser, input, OWN)
}

/**
 * The one writer.
 *
 * Two idempotencies, and they answer different questions. The **client
 * mutation id** answers *is this the same submission?* — a retried request, a
 * double-tapped button, a resumed connection. The **unique key** answers *is
 * this the same intention?* — the same possibility under the same intention,
 * whenever it was saved. §6 asks for both, and neither substitutes for the
 * other.
 *
 * ⚠ **Raw text is never deduplicated.** Two captures of the same words are two
 * captures: the same words can mean a different thing on a different day, and
 * the unique key does not constrain rows whose possibility is null. Only a
 * resolved capture collides.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Reviving a dropped capture does not rewrite where it came from
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The legacy `addEntry` refreshed `source` and `source_user_id` on every
 * revive, on the reasoning that a stale source would withhold a notification
 * that should now fire. **Captures invert that**, because provenance is
 * immutable here: a row that came off somebody's page came off it, and the day
 * that fact can be erased by re-adding the thing is the day the suppression
 * rule can be switched off from the client.
 *
 * ⚠ **The one movement allowed is `self` → sourced, and it is allowed because
 * it can only ever suppress more.** Add something yourself, cross it off, then
 * copy it from the person who had it: without this the revived row claims to
 * be independently yours and notifies the very person you took it from. The
 * three CASEs branch on one condition so the triple stays consistent with
 * `captures_provenance_shape` whichever way it falls.
 *
 * Clearing provenance is not possible here in either direction. That belongs
 * to a deliberate *make this one mine* mutation, which does not exist yet.
 */
async function writeCapture(
  sessionUser: SessionUser,
  input: AddCaptureInput,
  provenance: CaptureProvenance,
): Promise<Result<{ capture: Capture; created: boolean }>> {
  const text = input.text.trim()
  if (text === '') return err('invalid', 'Type something first.')
  if (text.length > TEXT_MAX) return err('invalid', 'That is too long to capture.')

  return db.transaction(async (tx) => {
    /*
      The submission check comes first and is a read, so a retry costs one
      query and never touches the unique key. Scoped to the owner, like
      everything else here: two people may legitimately generate the same id.
    */
    if (input.clientMutationId) {
      const [already] = await tx
        .select()
        .from(captures)
        .where(
          and(
            eq(captures.userId, sessionUser.id),
            eq(captures.clientMutationId, input.clientMutationId),
          ),
        )
        .limit(1)

      if (already) return ok({ capture: already, created: false })
    }

    /* The existing row, not `excluded` — Postgres resolves an unqualified
       column in an ON CONFLICT SET to the row already in the table. */
    const keepUnlessOwn = (existing: PgColumn, incoming: string) =>
      sql`case when ${captures.source} = 'self' then excluded.${sql.raw(incoming)} else ${existing} end`

    const [written] = await tx
      .insert(captures)
      .values({
        userId: sessionUser.id,
        text,
        possibilityId: input.possibilityId ?? null,
        intent: input.intent ?? null,
        state: 'want',
        clientMutationId: input.clientMutationId ?? null,
        ...provenance,
      })
      .onConflictDoUpdate({
        target: [captures.userId, captures.possibilityId, captures.intent],
        setWhere: eq(captures.state, 'dropped'),
        set: {
          text,
          state: 'want',
          resolvedAt: null,
          updatedAt: sql`now()`,
          source: keepUnlessOwn(captures.source, 'source'),
          sourceUserId: keepUnlessOwn(captures.sourceUserId, 'source_user_id'),
          sourceCaptureId: keepUnlessOwn(captures.sourceCaptureId, 'source_capture_id'),
        },
      })
      /*
        `xmax = 0` is how Postgres answers *did this statement insert the row,
        or update one that was already there*: an inserted tuple has no
        deleting transaction, an updated one carries the id of the transaction
        that superseded its predecessor. It is the only signal available —
        both paths return a row, and both return the same shape.
      */
      .returning({ ...getTableColumns(captures), inserted: sql<boolean>`(xmax = 0)` })

    if (!written) {
      const [existing] = await tx
        .select()
        .from(captures)
        .where(
          and(
            eq(captures.userId, sessionUser.id),
            input.possibilityId
              ? eq(captures.possibilityId, input.possibilityId)
              : sql`${captures.possibilityId} is null`,
            input.intent
              ? eq(captures.intent, input.intent)
              : sql`${captures.intent} is null`,
          ),
        )
        .limit(1)

      if (!existing) return err('conflict', 'Could not save that.')
      return ok({ capture: existing, created: false })
    }

    const { inserted, ...capture } = written

    /* A revive announces nothing and is not undoable. Only a real creation. */
    if (!inserted) return ok({ capture, created: false })

    await fireOverlap(tx, sessionUser, capture)
    return ok({ capture, created: true })
  })
}

/**
 * Copy something off someone else's page (§6, `source = 'copy'`).
 *
 * The caller passes **the capture id it can already see**, never a possibility
 * id, so a client cannot name a row it was never shown. Three things this gets
 * right by construction:
 *
 *   - **Only a shared, published capture can be copied.** The same four terms
 *     `listCapturesForOtherUser` applies, spelled again because this is a
 *     second door onto the same rows. It returns `not_found` rather than
 *     `forbidden`, deliberately: *that exists but is private* is itself the
 *     leak (§5.3).
 *   - **It always lands as a `want`**, whatever state the source was in.
 *     Copying a fixture must not assert that you own the thing too.
 *   - **It lands private**, like everything else. Copying someone's capture is
 *     not a decision to publish your own.
 *   - **Provenance is read from the row, never taken from the caller**, and it
 *     now records the capture as well as the person.
 */
export async function copyCapture(
  sessionUser: SessionUser,
  sourceCaptureId: string,
): Promise<Result<{ capture: Capture; created: boolean }>> {
  const outbound = alias(tracks, 'outbound')
  const inbound = alias(tracks, 'inbound')

  const [source] = await db
    .select({
      id: captures.id,
      text: captures.text,
      possibilityId: captures.possibilityId,
      intent: captures.intent,
      ownerId: captures.userId,
    })
    .from(captures)
    .innerJoin(outbound, and(eq(outbound.followerId, sessionUser.id), eq(outbound.followedId, captures.userId)))
    .innerJoin(inbound, and(eq(inbound.followerId, captures.userId), eq(inbound.followedId, sessionUser.id)))
    .where(
      and(
        eq(captures.id, sourceCaptureId),
        inArray(captures.visibility, SHARED_SCOPES),
        inArray(captures.state, PUBLIC_STATES),
      ),
    )
    .limit(1)

  if (!source) return err('not_found', 'That is no longer there.')

  if (source.ownerId === sessionUser.id) {
    return err('conflict', 'That one is already yours.')
  }

  return writeCapture(
    sessionUser,
    {
      text: source.text,
      possibilityId: source.possibilityId,
      intent: source.intent,
    },
    { source: 'copy', sourceUserId: source.ownerId, sourceCaptureId: source.id },
  )
}

/**
 * Resolve a capture (§8). `keep` answers the single question — *Go back?* for
 * an experience, *Keeping it?* for an object.
 *
 * ⚠ **A capture with no possibility and no intention has one kept-outcome
 * available.** `specFor` needs both to say where a kept thing lands, and an
 * unresolved capture supplies neither — so *yes* means `go_back_to`, the state
 * that says *I would return to this* without claiming ownership. Generalising
 * the outcomes properly is the later phase the specification describes, and
 * inventing a richer answer here would be guessing at it.
 */
export async function resolveCapture(
  sessionUser: SessionUser,
  captureId: string,
  keep: boolean,
): Promise<Result<Capture>> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({ capture: captures, possibility: possibilities })
      .from(captures)
      .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
      .where(and(eq(captures.id, captureId), eq(captures.userId, sessionUser.id)))
      .limit(1)

    if (!current) return err('not_found', 'No such capture.')
    if (current.capture.state !== 'want') {
      return err('conflict', 'That has already been resolved.')
    }

    /*
      ⚠ **The intention is derived when it was never set, and `'go_back_to'` is
      no longer written down as a constant.**

      `landsIn` needs a kind and an intention. A resolved capture has a kind —
      that is what accepting an offer gives it — and its intention is null,
      because §13 forbids asking for one before saving and nothing asks
      afterwards yet. `DEFAULT_INTENT` is the kind's own answer to *and what
      would you do with it*: see a film, read a book, try a place, own an
      object. That is §4's rule exactly — derive, never ask.

      ⚠ **It changes nothing today and that is the point.** The only catalogue
      is TMDB, so every kind that exists here is `film`, whose default is `see`,
      which lands in `go_back_to` — the same answer the hard-coded fallback
      gave. What it removes is the *constant*: the day a capture can be about an
      object, this lands it in `fixture` because the table says so, rather than
      in `go_back_to` because someone typed it here.

      ⚠ **A capture with no possibility still falls back**, and it has to: a raw
      capture has no kind, so there is nothing to derive from, and *Again?* is
      the only question that can be asked of it. See *Have is still not
      reachable* in the register for what is actually missing.
    */
    const kind = current.possibility?.kind ?? null
    const spec = kind ? specFor(kind, current.capture.intent ?? DEFAULT_INTENT[kind]) : null

    const state = keep ? (spec?.landsIn ?? ('go_back_to' as const)) : ('done' as const)

    const [updated] = await tx
      .update(captures)
      .set({ state, resolvedAt: new Date() })
      .where(eq(captures.id, captureId))
      .returning()

    // §6 runs on any state change: a want·own becoming a fixture is what makes
    // the lend match fire for someone who wants to see it.
    await fireOverlap(tx, sessionUser, updated)

    return ok(updated)
  })
}

/**
 * Cross a capture off. The × on the row.
 *
 * A resolution, not a delete (§5.1). `want` only — the same guard
 * `resolveCapture` uses, which makes the droppable set exactly the resolvable
 * set. One statement, so no transaction.
 */
export async function dropCapture(
  sessionUser: SessionUser,
  captureId: string,
): Promise<Result<Capture>> {
  const [updated] = await db
    .update(captures)
    .set({ state: 'dropped', resolvedAt: new Date() })
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        eq(captures.state, 'want'),
      ),
    )
    .returning()

  /*
    One message for both misses. A row that is not yours and a row that is no
    longer a want are indistinguishable from here on purpose (§5.3).
  */
  if (!updated) return err('not_found', 'That is not a want any more.')
  return ok(updated)
}

/**
 * Put a crossed-off capture back. The same ×, tapped again.
 *
 * ⚠ `created_at` is untouched, which is the difference from `addCapture`'s
 * revive: this is a want that never stopped being where it was.
 */
export async function restoreCapture(
  sessionUser: SessionUser,
  captureId: string,
): Promise<Result<Capture>> {
  const [updated] = await db
    .update(captures)
    .set({ state: 'want', resolvedAt: null })
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        eq(captures.state, 'dropped'),
      ),
    )
    .returning()

  if (!updated) return err('not_found', 'That is not crossed off.')
  return ok(updated)
}

/**
 * Write the private note on your own capture. Owner-filtered, like every
 * mutation here. An empty string clears to `null`, so "no note" has one
 * representation.
 */
export async function setCaptureNote(
  sessionUser: SessionUser,
  captureId: string,
  note: string | null,
): Promise<Result<Capture>> {
  const trimmed = note?.trim() ?? ''
  if (trimmed.length > NOTE_MAX) return err('invalid', 'That note is too long.')

  const [updated] = await db
    .update(captures)
    .set({ note: trimmed === '' ? null : trimmed })
    .where(and(eq(captures.id, captureId), eq(captures.userId, sessionUser.id)))
    .returning()

  if (!updated) return err('not_found', 'No such capture.')
  return ok(updated)
}

/**
 * Rewrite the words of your own capture. **Text and nothing else.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What this deliberately does not touch, and why each one matters
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Provenance.** `source`, `sourceUserId` and `sourceCaptureId` are immutable
 * here for the reason `writeCapture` gives at length: they are the input to §6's
 * suppression rule, so anything that can rewrite them can switch suppression off
 * and turn copying somebody's list into a way of notifying them. Editing the
 * words of a copied capture does not make it yours.
 *
 * ⚠ **State.** Crossing off, restoring, settling and undoing each own the state
 * column and each carry a guard this does not duplicate. A line's words and a
 * line's fate are separate facts, and an edit is not a revival.
 *
 * ⚠ **`possibilityId`.** So an edit cannot silently un-resolve a capture — and
 * cannot silently *re*-resolve one either. **This leaves a real question open**,
 * and it belongs to *Resolution offers* rather than here: a capture resolved to
 * *Jaws* and then edited to read *pottery class* still matches as *Jaws*. It
 * cannot happen today, because nothing on the page resolves anything yet. When
 * offers exist, that path decides whether an edit withdraws a resolution — and
 * it must decide it deliberately, not inherit it from this function.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **No overlap trigger, and that is a finding rather than an omission.**
 * `fireOverlap` returns early without a `possibilityId`, so **convergence keys on
 * the possibility and never on raw text.** An edit cannot change what a capture
 * matches, so there is nothing to announce. Do not add a `fireOverlap` call here
 * on the assumption that a changed line is a changed signal — it is not, and the
 * fan-out's own rule is that it runs when a capture *becomes a signal it was not
 * already*.
 *
 * ⚠ **`normalised_text` re-derives itself.** It is a generated column over
 * `text`, so Phase 2's possible-match path stays correct after an edit with no
 * second write and no chance of the two disagreeing. That is the column comment's
 * argument for generating it, arriving exactly where it was predicted to.
 *
 * ⚠ **No state filter, unlike `dropCapture`.** Any capture you own can be
 * rewritten, crossed off or settled included: a typo in a line is a typo whatever
 * became of the intention, and there is no guarantee here that a state could
 * protect.
 *
 * Idempotent by construction — it is a `SET`, so the same words written twice
 * leave the same row, which is what §10 asks of a mutation that can be retried.
 */
export async function setCaptureText(
  sessionUser: SessionUser,
  captureId: string,
  text: string,
): Promise<Result<Capture>> {
  const trimmed = text.trim()
  /*
    ⚠ **Empty is a refusal, not a clear.** `setCaptureNote` treats `''` as
    "no note" because a capture without a note is ordinary; a capture without
    words is not a capture at all. Deleting one is the ×, or the undo window.
  */
  if (trimmed === '') return err('invalid', 'A capture needs some words.')
  if (trimmed.length > TEXT_MAX) return err('invalid', 'That is too long.')

  const [updated] = await db
    .update(captures)
    .set({ text: trimmed })
    .where(and(eq(captures.id, captureId), eq(captures.userId, sessionUser.id)))
    .returning()

  if (!updated) return err('not_found', 'No such capture.')
  return ok(updated)
}

/* -------------------------------------------------------------------------- */
/*  Resolution offers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * **One capture's own words, read back.**
 *
 * ⚠ **The offer path asks the server what the line says rather than trusting
 * the client's copy.** A line can be rewritten between the Return that created
 * it and the offer that arrives behind it, and a suggestion made against words
 * that are no longer on the row is a question about something nobody wrote.
 *
 * ⚠ **It returns `text` and nothing else.** `note` is owner-only forever and
 * a whole-row read is how a private column reaches a caller that never meant to
 * ask for one — the same argument `SHARED_CAPTURE_COLUMNS` makes, applied to a
 * read that has no business with anything but the words.
 */
export async function getMyCaptureText(
  sessionUser: SessionUser,
  captureId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ text: captures.text })
    .from(captures)
    .where(and(eq(captures.id, captureId), eq(captures.userId, sessionUser.id)))
    .limit(1)

  return row?.text ?? null
}

/**
 * **Offer a capture a possibility.** Writes the suggestion; resolves nothing.
 *
 * A capture is complete when it is saved (§13). This is the *question*, held on
 * the row so that it stands rather than being recomputed — see
 * `suggested_possibility_id` in the schema for why a question that disappears
 * on reload has answered itself.
 *
 * ⚠ **Four conditions, all in the `WHERE`, and none of them is a read-then-
 * write.** A capture that already resolved has nothing to be asked; one that
 * already carries a standing offer must not have it replaced under an open
 * question; and one that was answered *No* must never be asked again — that is
 * the whole difference between ignoring and refusing. Putting them in the
 * predicate means a concurrent accept and a late-arriving suggestion cannot
 * interleave into a capture that is both resolved and offered.
 *
 * ⚠ **Not an error when it writes nothing.** The provider path is
 * fire-and-forget and races the person using the page; *the offer did not
 * land* is an ordinary outcome and is reported as `false`, not as a failure.
 */
export async function suggestForCapture(
  sessionUser: SessionUser,
  captureId: string,
  possibilityId: string,
): Promise<Result<boolean>> {
  const [updated] = await db
    .update(captures)
    .set({ suggestedPossibilityId: possibilityId })
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        isNull(captures.possibilityId),
        isNull(captures.suggestedPossibilityId),
        isNull(captures.resolutionDeclinedAt),
      ),
    )
    .returning({ id: captures.id })

  return ok(Boolean(updated))
}

/**
 * **Yes.** The suggestion becomes the capture's possibility.
 *
 * ⚠ **The words are not touched.** §6: the text is what somebody typed and is
 * never replaced by a suggestion's title. What changes is what the capture is
 * *about*, which is the only thing resolving means.
 *
 * ⚠ **The suggestion is left where it is**, so the row still records what was
 * offered as well as what was taken. They are equal after this and that is not
 * redundancy: the day an offer can be superseded, the two columns are how you
 * tell an accepted offer from a resolution that arrived another way.
 *
 * ⚠ **`intent` stays null, so the unique key cannot bite.** The key is
 * (user, possibility, intent) and Postgres treats NULLs as distinct, so
 * resolving two captures to the same film is allowed — which is correct, since
 * two captures of the same thing on different days are two intentions until
 * something says otherwise. The day intent is set on a resolution, this
 * function has to answer for the collision; it does not today, and that is
 * stated rather than discovered.
 *
 * ⚠ **No overlap trigger.** §6 keys convergence on the possibility, and this is
 * the moment a capture acquires one — so this is exactly where `fireOverlap`
 * will belong when Phase 2's second trigger is wired to captures. It is not
 * called here because this phase ships no convergence surface, and a
 * notification nobody can look at is noise with a delivery cost.
 */
export async function acceptSuggestion(
  sessionUser: SessionUser,
  captureId: string,
): Promise<Result<Capture>> {
  const [updated] = await db
    .update(captures)
    .set({ possibilityId: sql`${captures.suggestedPossibilityId}` })
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        isNull(captures.possibilityId),
        isNotNull(captures.suggestedPossibilityId),
        isNull(captures.resolutionDeclinedAt),
      ),
    )
    .returning()

  if (!updated) return err('not_found', 'That question is no longer open.')
  return ok(updated)
}

/**
 * **No.** This possibility is not the one, and nothing offers it again.
 *
 * ⚠ **It stamps rather than clears.** Keeping `suggested_possibility_id`
 * beside the timestamp is what makes the refusal specific — *not this one* —
 * rather than a capture that merely stopped being asked. A future offer path
 * has to be able to tell those apart.
 *
 * Idempotent: saying No twice leaves the same row, minus a second timestamp,
 * which is what the `isNull` guarantees.
 */
export async function declineSuggestion(
  sessionUser: SessionUser,
  captureId: string,
): Promise<Result<Capture>> {
  const [updated] = await db
    .update(captures)
    .set({ resolutionDeclinedAt: sql`now()` })
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        isNull(captures.resolutionDeclinedAt),
      ),
    )
    .returning()

  if (!updated) return err('not_found', 'That question is no longer open.')
  return ok(updated)
}

/**
 * Change who a capture reaches.
 *
 * **The only way a capture stops being private**, and it is one function so
 * that sharing is always a deliberate act with a single implementation. It
 * takes a `Visibility` rather than a boolean because the scopes will grow, and
 * a boolean would have to be reinterpreted on the day they do.
 *
 * ⚠ Sharing does not publish a private *state*. A `done` capture set to
 * `mutuals` still reaches nobody, because `PUBLIC_STATES` is a separate term
 * in the read — which is exactly why visibility was added as a fourth term
 * rather than as a replacement.
 */
export async function setCaptureVisibility(
  sessionUser: SessionUser,
  captureId: string,
  visibility: Visibility,
): Promise<Result<Capture>> {
  const isShared = (scope: Visibility) =>
    (SHARED_SCOPES as readonly string[]).includes(scope)

  return db.transaction(async (tx) => {
    /*
      The scope it held before, read inside the transaction so the comparison
      cannot race the write. It is the only reason this is a transaction at
      all beyond §10's rule that a write and its notifications apply together.
    */
    const [before] = await tx
      .select({ visibility: captures.visibility })
      .from(captures)
      .where(and(eq(captures.id, captureId), eq(captures.userId, sessionUser.id)))
      .limit(1)

    if (!before) return err('not_found', 'No such capture.')

    const [updated] = await tx
      .update(captures)
      .set({ visibility })
      .where(and(eq(captures.id, captureId), eq(captures.userId, sessionUser.id)))
      .returning()

    if (!updated) return err('not_found', 'No such capture.')

    /*
      ⚠ **Sharing is a fan-out trigger, and it is the one the migration made
      load-bearing.** Every migrated capture landed private, so nothing
      converges until its owner shares it — and if this did not fire, a capture
      that was created private and shared afterwards would never converge at
      all, because the moment it became a signal would have passed unobserved.

      ⚠ **It fires on the transition, not on the call.** Setting `mutuals` on
      something already shared changed nothing, so there is nothing to
      announce — and announcing it anyway wrote a second identical
      notification at the counterpart, every time. §10 requires a mutation to
      be idempotent, and a share control that a person can tap twice is the
      ordinary case rather than the strange one.

      This is the same rule the revive path follows: **the fan-out runs when a
      capture becomes a signal it was not already**, and never merely because
      a writer touched the row.
    */
    if (!isShared(before.visibility) && isShared(updated.visibility)) {
      await fireOverlap(tx, sessionUser, updated)
    }

    return ok(updated)
  })
}

/**
 * The one exception to "nothing is ever deleted" (§5.1): a 10-second undo on
 * creation, for typos. Bounded by `created_at` in SQL rather than trusted from
 * the client, and it will not touch anything already resolved.
 */
export async function undoCapture(
  sessionUser: SessionUser,
  captureId: string,
): Promise<Result<null>> {
  const [deleted] = await db
    .delete(captures)
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        eq(captures.state, 'want'),
        sql`${captures.createdAt} > now() - make_interval(secs => ${UNDO_WINDOW_MS / 1000})`,
      ),
    )
    .returning()

  if (!deleted) return err('not_found', 'Too late to undo that.')
  return ok(null)
}
