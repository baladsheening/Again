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
  notifications,
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
import {
  legacyState,
  PUBLIC_STATUSES,
  PUBLIC_VERDICTS,
  SHARED_SCOPES,
  STATE_SPLIT,
} from '@/lib/domain'
import type {
  CaptureSource,
  CaptureStatus,
  CaptureVerdict,
  Intent,
  Kind,
  Visibility,
} from '@/lib/domain'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The vocabulary migration, stage 1 — STEP B. Read the new, write both.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `docs/re-direction/vocabulary-migration.md` is the runbook. In short: the
 * columns exist and are backfilled (step A, applied to production), this deploy
 * starts **reading** `status`/`verdict` and **writing both** vocabularies, and
 * step C drops `state` once nothing has touched it for a deploy.
 *
 * ⚠ **The dual-write is what keeps every step revertible and it must not be
 * tidied away early.** The moment `state` stops being written, a rollback to a
 * build that reads it finds stale rows.
 */

/**
 * *Can another person see this capture?* — `PUBLIC_STATES` re-derived onto the
 * two axes, in **one place**, because it had two call sites and a privacy
 * predicate with two copies is a privacy predicate with one of them wrong.
 *
 * ⚠⚠ **TWO POSITIVE ALLOWLISTS, JOINED BY `or`. NEVER A DENYLIST.** The short
 * form is `status <> 'dropped' and verdict is not null`, and it is the exact
 * shape `listEntriesForOtherUser` carried before `dropped` existed — correct
 * until the next value is added, and its failure is somebody's private rows on
 * their page. Listed-or-invisible fails the other way.
 *
 * ⚠ **A `completed` capture can be public**, which is the half that surprises:
 * `again` and `have` are verdicts on a finished thing and they belong on
 * somebody's page, while `completed` with a null verdict is today's `done`,
 * which §5.3 makes owner-only. A reader that checked `status` alone would hide
 * every *Again* and *Have* — wrong, but wrong in the safe direction.
 *
 * Asserted on both sides: `tests/state-split.test.ts` for the shape,
 * `scripts/verify-status-backfill.mjs` for the rows.
 */
function isPublicCapture() {
  return or(
    inArray(captures.status, PUBLIC_STATUSES),
    inArray(captures.verdict, PUBLIC_VERDICTS),
  )
}

/**
 * The dual-write, in one expression. **Every write of a capture's lifecycle
 * goes through this** — there is no other way to set `state`, `status` or
 * `verdict` in this file, which is what stops the two vocabularies drifting
 * between five call sites.
 *
 * ⚠ **It takes the NEW vocabulary and derives the old one**, never the reverse.
 * The callers below decide a status and a verdict; `legacyState` writes the
 * mirror. At step C the `state` line is deleted and every caller is already
 * correct — which is the test of whether this direction was chosen right.
 */
function lifecycle(status: CaptureStatus, verdict: CaptureVerdict | null) {
  return { status, verdict, state: legacyState(status, verdict) }
}

/*
  ⚠⚠ **`lifecycleOf` WAS HERE AND IS DELETED — step C1, and the constraint is
  what replaced it.**

  It existed for one reason: `status` was nullable, so a capture written by a
  **pre-step-B build** carried a correct `state` and no status, and
  `fireOverlap` would have read null and classified it as nothing. The compiler
  found that, not a test.

  `0013` heals any such row and then makes the column `NOT NULL`, so the case
  it handled **cannot occur** — removing the condition rather than correcting
  for it, in the order *How things get fixed* asks for. A function that copes
  with an impossible value is a function the next reader keeps alive by
  assuming it must still be needed.

  ⚠ **This is why C1 tightens the column BEFORE C2 deletes `state`.** With
  `state` gone there would be nothing left to derive a null status from, so the
  order is forced: constrain, then delete.
*/


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
  status: captures.status,
  verdict: captures.verdict,
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
    state: legacyState(capture.status, capture.verdict),
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

/**
 * The four owner views, on the two axes — step B.
 *
 * ⚠ **`live` is the one that changed shape rather than vocabulary.** It was a
 * list of three states; it is now *active, or crossed off, or worth repeating*,
 * which is two axes and cannot be one `inArray`. The membership is identical —
 * `want`, `dropped`, `go_back_to` — and `tests/state-split.test.ts` is what
 * says so.
 *
 * ⚠ **The comment this replaces is still true and is kept:** a go-back-to is
 * still a want (§5.2), and a crossed-off want stays on the page struck through.
 * That is safe here only because the shared read applies `isPublicCapture()` as
 * well — see `listEntriesForOtherUser` for the full note; the inversion it
 * describes is what makes widening this view safe.
 *
 * ⚠ **`fixtures` and `archive` are now the same column read two ways**, which
 * makes visible something the old vocabulary hid: *Have* and *Done* differ only
 * in whether a verdict was recorded. `archive` is `completed` with **no**
 * verdict, and that `isNull` is load bearing — without it the archive would
 * swallow every Again and Have.
 */
function stateFilter(view: OwnerView) {
  switch (view) {
    case 'live':
      return or(
        inArray(captures.status, ['active', 'dropped'] as const),
        eq(captures.verdict, 'again' as const),
      )
    case 'go_back_tos':
      return eq(captures.verdict, 'again' as const)
    case 'fixtures':
      return eq(captures.verdict, 'have' as const)
    case 'archive':
      return and(eq(captures.status, 'completed' as const), isNull(captures.verdict))
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
      asc(sql`case when ${captures.verdict} = 'again' then 1 else 0 end`),
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
    .select({
      status: captures.status,
      verdict: captures.verdict,
      count: sql<number>`count(*)::int`,
    })
    .from(captures)
    .where(eq(captures.userId, sessionUser.id))
    .groupBy(captures.status, captures.verdict)

  /*
    ⚠ **Grouped on the PAIR, and counted through `legacyState` — step C2.** The
    four view totals are still expressed in the old words because `OwnerView` is
    a UI shape and belongs to B2; what changed is that they are derived from the
    two axes rather than read off a column. Same one implementation as every
    other projection here.
  */
  const byState = new Map<CaptureState, number>()
  for (const r of rows) {
    const key = legacyState(r.status, r.verdict)
    byState.set(key, (byState.get(key) ?? 0) + r.count)
  }
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
        isPublicCapture(),
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
    .select({
      id: captures.id,
      intent: captures.intent,
      status: captures.status,
      verdict: captures.verdict,
    })
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

  return rows.map((r) => ({
    captureId: r.id,
    intent: r.intent,
    state: legacyState(r.status, r.verdict),
  }))
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
      status: capture.status,
      verdict: capture.verdict,
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
const PAGE_STATUSES = ['active', 'dropped'] as const satisfies readonly CaptureStatus[]

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The mark — Phase 2 step 4, 31 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Has this line ever converged with anybody.** One bit, on every read that
 * draws a line of the record.
 *
 * ⚠ **`read_at` is not in it, and that absence IS the mark.** The portal reads
 * `is null` because the portal empties; this one does not, because the mark is
 * what is left when it has. §5 of `phase-2-convergence.md`: *the portal is
 * arrival, the mark is memory* — the portal answers *what happened while I was
 * away*, the mark answers *why is this line special* when you meet it again in
 * March. Adding a `read_at` term here would make the mark a second portal with a
 * longer fuse and delete the only durable record that a convergence happened.
 *
 * ⚠ **A bit, not the sentence, and that is what keeps it affordable.** This runs
 * once per line of every page read — the one screen whose whole promise is that
 * Return lands in under a frame — so what rides with the record is `exists`,
 * which the planner can stop at the first row. **The sentence is fetched when a
 * console opens**, by `getConvergence`, and it is fetched *only* for a line
 * whose bit is set: a record with no convergences in it never issues that read
 * at all. See `console.tsx`, which was built expecting exactly this — *when who
 * else arrives it has to arrive into a space that is already there.*
 *
 * ⚠ **The join is `payload->>'itemId'`, the same one `listMyPortal` makes, and
 * for the same reason: a notification carries no capture id and cannot.** A
 * match is about a *possibility* that two people's captures both point at, so
 * the viewer's own capture is found at read time. Every payload written before
 * any of this existed works unchanged.
 *
 * ⚠ **`notifications.user_id = captures.user_id` is the privacy term**, and it
 * is written against the capture rather than against the session so that it
 * cannot come adrift of the row it is deciding about. Every caller already
 * filters `captures.userId = sessionUser.id`; this correlation means the
 * subquery is right even if one ever stopped. A notification names a
 * counterpart — it must never be a door to the counterpart's row (§3).
 *
 * ⚠ **An unresolved capture is `false` by arithmetic, not by a guard.**
 * `possibility_id` is null on most lines, the comparison is then null, and `exists`
 * over no rows is false. Two people can only converge on a possibility (§13), so
 * a raw capture having no mark is the truth rather than a missing case.
 */
const converged = sql<boolean>`exists (
  select 1
  from ${notifications}
  where ${notifications.userId} = ${captures.userId}
    and ${notifications.payload} ->> 'itemId' = ${captures.possibilityId}::text
)`

/**
 * **Whether this line is in the convergence pool** — the lock, 31 August.
 *
 * ⚠ **Derived from the SCOPE, never compared to `'private'`.** The question the
 * row asks is *can this converge*, and the answer is *is its visibility one of
 * `SHARED_SCOPES`* — which is the same predicate `runOverlap` and
 * `listCapturesForOtherUser` apply. Written as `= 'private'` it would be a
 * second definition of the pool, right today and wrong the day a third scope
 * exists. That is the reason `setCaptureVisibility` takes a `Visibility` rather
 * than a boolean, stated once more at the read end.
 *
 * ⚠ **A bit crossing to a client, not the scope itself.** The record draws one
 * thing — a padlock or nothing — and a page holding the enum would be a page
 * able to invent a second reading of it. Same rule as `offer` and `hasImage`.
 */
const shared = sql<boolean>`${inArray(captures.visibility, SHARED_SCOPES)}`

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
  /**
   * **Whether there is a photograph on this line** — not where it is.
   *
   * ⚠ **The pathname never crosses to a client.** The bytes live in a private
   * store and `/api/media/[captureId]` is the one door; a client that held the
   * pathname would be holding the only thing the door checks *for*, and the
   * check would be decoration. The id it already has is enough to ask.
   */
  hasImage: boolean
  /**
   * **The link this capture was written against**, or `null`.
   *
   * ⚠ **The value itself, unlike the photograph beside it.** A picture is
   * *whether*, because its bytes are private and reachable only through a door
   * that checks the session; a link is a public address and the page has to
   * draw an `href` from it. There is nothing to withhold and no door to build.
   *
   * ⚠ **It is still private to the owner**, and the enforcement is that no
   * projection built for anybody else selects it —
   * `SHARED_CAPTURE_COLUMNS` is an allowlist and this is not on it.
   */
  sourceUrl: string | null
  /**
   * **Whether this line has ever converged with anybody** — the mark, Phase 2
   * step 4.
   *
   * ⚠ **Whether, never who — and unlike the photograph beside it, that is about
   * cost rather than privacy.** *Who* is a sentence, and a sentence is names and
   * tenses aggregated per line; this is an `exists` that rides the record's own
   * read. The names arrive when a console opens — `getConvergence` — so the
   * fifty lines nobody has tapped never pay for them.
   *
   * ⚠ **It does not empty.** See `converged` above: the portal reads unread and
   * empties, this reads all of them and does not. Two facts, deliberately not
   * one column.
   */
  converged: boolean
  /**
   * **Whether this line is in the convergence pool** — the inverse of the lock.
   *
   * ⚠ **The scope, reduced to the one bit a row can draw.** `true` is the
   * ordinary case since 31 August, when captures started being written
   * shareable; `false` is a line its owner locked, which draws a padlock and
   * matches nobody. See `shared` above for why it is derived from
   * `SHARED_SCOPES` rather than compared to `'private'`.
   *
   * ⚠ **It says nothing about who can read the line.** Browsing somebody's
   * record needs all four terms of `listCapturesForOtherUser`; this is only
   * about whether the fan-out may see it.
   */
  shared: boolean
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
      /* ⚠ Step C2: the two axes are selected and `state` is DERIVED on the
         way out — see the mapper below. The column is no longer read by
         anything, which is the precondition for dropping it. */
      status: captures.status,
      verdict: captures.verdict,
      year: possibilities.year,
      createdAt: captures.createdAt,
      resolved: captures.possibilityId,
      declinedAt: captures.resolutionDeclinedAt,
      offerTitle: suggested.title,
      offerYear: suggested.year,
      imagePath: captures.imagePath,
      sourceUrl: captures.sourceUrl,
      /* The mark — see `converged` above for why `read_at` is not in it. */
      converged,
      /* The lock — see `shared` above for why it is the scope and not `private`. */
      shared,
    })
    .from(captures)
    /* LEFT, because a capture with nothing canonical behind it is the norm. */
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .leftJoin(suggested, eq(suggested.id, captures.suggestedPossibilityId))
    .where(
      and(
        eq(captures.userId, sessionUser.id),
        inArray(captures.status, PAGE_STATUSES),
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

  return rows.map(({ resolved, declinedAt, offerTitle, offerYear, imagePath, status, verdict, ...line }) => ({
    ...line,
    state: legacyState(status, verdict),
    /* Whether, never where — see `PageLine.hasImage`. */
    hasImage: imagePath !== null,
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
  const rows = await db
    .select({
      id: captures.id,
      text: captures.text,
      /* ⚠ Step C2: the two axes are selected and `state` is DERIVED on the
         way out — see the mapper below. The column is no longer read by
         anything, which is the precondition for dropping it. */
      status: captures.status,
      verdict: captures.verdict,
      year: possibilities.year,
      createdAt: captures.createdAt,
      offer: sql<null>`null`,
      hasImage: sql<boolean>`${captures.imagePath} is not null`,
      /*
        ⚠ **The link travels to both of these, unlike the offer above.** A
        question is a thing to answer and neither surface can, so both write a
        literal null; a link is a way back to the thing and both surfaces are
        places somebody is looking for one.
      */
      sourceUrl: captures.sourceUrl,
      /*
        ⚠ **The mark travels to both of these too, and it is the same bit.** A
        line that converged is special wherever it is drawn — the tray and
        search are both places somebody meets a line again in March, which is
        the case §5 says the mark exists for. One expression, three reads.
      */
      converged,
      /* The lock, on the same terms: one predicate, three reads. */
      shared,
    })
    .from(captures)
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .where(
      and(
        eq(captures.userId, sessionUser.id),
        /*
          ⚠ **Three states became ONE predicate, and that is the two-axis model
          paying for itself.** `go_back_to`, `fixture` and `done` were a list
          because the old vocabulary had no word for what they share. They share
          `completed` — the tray IS the settled captures — so the day a fourth
          verdict exists it is in the tray already, with nothing added here.
        */
        eq(captures.status, 'completed' as const),
      ),
    )
    .orderBy(desc(captures.resolvedAt), desc(captures.id))
    .limit(limit)
    .offset(offset)

  /* ⚠ Step C2: `state` is derived rather than selected — one implementation,
     `legacyState`, shared with the page's own mapper above. */
  return rows.map(({ status, verdict, ...line }) => ({
    ...line,
    state: legacyState(status, verdict),
  }))
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
  const rows = await db
    .select({
      id: captures.id,
      text: captures.text,
      /* ⚠ Step C2: the two axes are selected and `state` is DERIVED on the
         way out — see the mapper below. The column is no longer read by
         anything, which is the precondition for dropping it. */
      status: captures.status,
      verdict: captures.verdict,
      year: possibilities.year,
      createdAt: captures.createdAt,
      offer: sql<null>`null`,
      hasImage: sql<boolean>`${captures.imagePath} is not null`,
      /*
        ⚠ **The link travels to both of these, unlike the offer above.** A
        question is a thing to answer and neither surface can, so both write a
        literal null; a link is a way back to the thing and both surfaces are
        places somebody is looking for one.
      */
      sourceUrl: captures.sourceUrl,
      /*
        ⚠ **The mark travels to both of these too, and it is the same bit.** A
        line that converged is special wherever it is drawn — the tray and
        search are both places somebody meets a line again in March, which is
        the case §5 says the mark exists for. One expression, three reads.
      */
      converged,
      /* The lock, on the same terms: one predicate, three reads. */
      shared,
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

  /* ⚠ Step C2: `state` is derived rather than selected — one implementation,
     `legacyState`, shared with the page's own mapper above. */
  return rows.map(({ status, verdict, ...line }) => ({
    ...line,
    state: legacyState(status, verdict),
  }))
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
  /**
   * A blob pathname, already stored and already stripped.
   *
   * ⚠ **The upload happens before this and the row is what makes it reachable.**
   * A photograph is not a capture until it is captioned, so the object exists
   * for the moment between the two — and if this write fails, the caller takes
   * it back out. See `captureWithImageAction`.
   */
  imagePath?: string | null
  /**
   * A link lifted out of the line that became this capture.
   *
   * ⚠ **Validated at the boundary and again here.** The action's Zod schema is
   * the first check and this is the second, because §10 asks for Zod at every
   * boundary and `lib/db/` is one: a `javascript:` or `data:` URL reaching a
   * rendered `href` is script running against the session that stored it, and
   * the column is written once but read on every page load forever.
   */
  sourceUrl?: string | null
}

/**
 * **The two schemes a stored link may use, and there are exactly two.**
 *
 * ⚠ **An allowlist, never a denylist.** `javascript:` is the one everybody
 * thinks of and it is not the only one — `data:`, `vbscript:`, `blob:` and
 * anything a future browser invents all end in the same place, which is a
 * rendered `href` executing. Naming what is permitted makes the set of
 * dangerous schemes irrelevant rather than something to keep up with.
 */
const LINK_SCHEMES = ['http:', 'https:']

/** How much URL is a URL. Longer than this is a payload wearing a link's shape. */
export const SOURCE_URL_MAX = 2048

/**
 * A link, or nothing. **Never a thrown error and never a rejected capture** —
 * the words are the capture, and a link that cannot be parsed is a link the
 * page drops rather than a save the page refuses.
 */
export function cleanSourceUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed.length > SOURCE_URL_MAX) return null
  try {
    const url = new URL(trimmed)
    return LINK_SCHEMES.includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
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
        imagePath: input.imagePath ?? null,
        /*
          ⚠ **Cleaned here rather than trusted from the caller.** This is the
          one writer, so a link that reaches a row has passed this exactly once
          no matter which action called — and a scheme that is not http(s) is
          dropped rather than refused, because the words are the capture and a
          bad link must not cost somebody their sentence.
        */
        sourceUrl: cleanSourceUrl(input.sourceUrl),
        ...lifecycle('active', null),
        /*
          ─────────────────────────────────────────────────────────────────────
           A capture is SHAREABLE when it is written — directed 31 August
          ─────────────────────────────────────────────────────────────────────

          ⚠⚠ **THIS OVERRULES THE SPECIFICATION'S `captures are private`
          DEFAULT, AND IT WAS DIRECTED WITH THAT STATED.** §7 of
          `implementation-spec.md` requires private-by-default with one scope a
          capture can be moved into, and §13 lists *share visibility* as a Phase
          2 deliverable. The scope existed, the control never got built, and the
          effect was that **the entire social half of the product was inert**:
          the column defaulted to `private`, `runOverlap` requires
          `SHARED_SCOPES`, and nothing anywhere called `setCaptureVisibility`. On
          31 August production held 79 captures, all private, 0 notifications.

          ⚠ **The argument that won is the four-second capture.** A per-capture
          share act is a beat *after* the capture — one you have to remember to
          come back for — and its failure is silent: you simply never converge
          with anybody and never learn why. **The consent is the mutual track**,
          which is deliberate, two-directional, and given by handle to someone
          you chose. What a convergence discloses is one overlap on one
          possibility, to one such person. It is not a way to read your list —
          `listCapturesForOtherUser` keeps every one of its four terms, and this
          changes nothing about who can *browse* a record.

          ⚠ **What replaces it is the LOCK**, which is the same column pointed
          the other way: a swipe on a row sets `private` and takes that line out
          of the pool. So the scope is still per-capture and still enforced in
          this layer — the default moved, the mechanism did not.

          ⚠ **Deliberately NOT in the `onConflictDoUpdate` below.** A revive is a
          crossed-off capture being written again, and its scope is whatever its
          owner last chose: re-locking on every revive would be a control the
          person did not touch changing under them.

          ⚠⚠ **A CAPTURE THAT CAME FROM SOMEBODY ELSE STAYS PRIVATE, and that is
          a guarantee rather than a leftover default.** It is the same reasoning
          §6 already applies to suppression: **a received list is not an
          independent common intention.** If a copy is not independent enough to
          notify the person it was taken from, it is not independent enough to be
          republished onward to *my* mutuals without my touching it. The lock's
          swipe is what makes it shareable — one gesture, deliberately taken.
          `tests/guarantees.test.ts` names this in its own case.
        */
        visibility: provenance.source === 'self' ? SHARED_SCOPES[0] : 'private',
        clientMutationId: input.clientMutationId ?? null,
        ...provenance,
      })
      .onConflictDoUpdate({
        target: [captures.userId, captures.possibilityId, captures.intent],
        setWhere: eq(captures.status, 'dropped'),
        set: {
          text,
          /*
            ⚠ **It travels with `text`, because it came out of it.** A revive
            already replaces the words with the ones just typed; leaving the old
            link on the row would attach the previous sentence's source to this
            one, which is the app asserting a provenance nobody stated. Null is
            the honest value when this capture arrived without a link.
          */
          sourceUrl: cleanSourceUrl(input.sourceUrl),
          ...lifecycle('active', null),
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
        isPublicCapture(),
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
    if (current.capture.status !== 'active') {
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

    /*
      ⚠ **`landsIn` still speaks the legacy vocabulary and is TRANSLATED here
      rather than retyped — step B stops at the data layer.** `VOCABULARY` is a
      table of user-facing words and their consequences, and retyping it is
      step B2's job along with every screen that reads it. `STATE_SPLIT` is the
      one mapping, so translating through it cannot disagree with the backfill.

      Settling always completes the capture; what `keep` decides is whether a
      verdict is recorded. That is the two-axis model saying out loud what the
      five states could only imply.
    */
    const landed = keep ? (spec?.landsIn ?? ('go_back_to' as const)) : ('done' as const)
    const { verdict } = STATE_SPLIT[landed]

    const [updated] = await tx
      .update(captures)
      .set({ ...lifecycle('completed', verdict), resolvedAt: new Date() })
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
    .set({ ...lifecycle('dropped', null), resolvedAt: new Date() })
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        eq(captures.status, 'active'),
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
    .set({ ...lifecycle('active', null), resolvedAt: null })
    .where(
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        eq(captures.status, 'dropped'),
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
/**
 * **Where this person's photograph is**, or `null`.
 *
 * ⚠ **Owner-filtered, and that filter is the access control.** `/api/media`
 * has no other check: a request either names a capture belonging to the session
 * user or it gets nothing, and there is deliberately no parameter here that
 * could relax it. Images on somebody else's page are a later question and this
 * function is not where it gets answered.
 */
/**
 * **Has this submission already been written?**
 *
 * ⚠ **The same read `writeCapture` does, hoisted so a photograph is not
 * uploaded twice.** A retried submission must not put a second megabyte in the
 * store on its way to discovering the row exists — so the check happens before
 * the upload rather than inside the insert. The two agree because they are the
 * same predicate on the same unique key; if that ever stops being true, the
 * upload is the thing that pays.
 */
export async function findMyCaptureByMutationId(
  sessionUser: SessionUser,
  clientMutationId: string,
): Promise<Capture | null> {
  const [row] = await db
    .select()
    .from(captures)
    .where(
      and(
        eq(captures.userId, sessionUser.id),
        eq(captures.clientMutationId, clientMutationId),
      ),
    )
    .limit(1)

  return row ?? null
}

export async function getMyCaptureImagePath(
  sessionUser: SessionUser,
  captureId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ path: captures.imagePath })
    .from(captures)
    .where(and(eq(captures.id, captureId), eq(captures.userId, sessionUser.id)))
    .limit(1)

  return row?.path ?? null
}

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
        eq(captures.status, 'active'),
        sql`${captures.createdAt} > now() - make_interval(secs => ${UNDO_WINDOW_MS / 1000})`,
      ),
    )
    .returning()

  if (!deleted) return err('not_found', 'Too late to undo that.')
  return ok(null)
}
