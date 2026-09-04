import 'server-only'
import { legacyState } from '@/lib/domain'
import type { CaptureStatus, CaptureVerdict } from '@/lib/domain'

import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { db } from './client'
import { captures, notifications, possibilities, profiles, tracks } from './schema'
import type { SessionUser } from './session'
import type { PageLine } from './captures'
import { portalSentence } from '@/lib/overlap'
import type { NotificationKind } from '@/lib/domain'

/**
 * **The portal's read — the first thing in this app that reads `notifications`.**
 *
 * The fan-out has been deployed and running since Phase 2's engine landed, and
 * nothing has ever looked at what it wrote. This is the surface that does, which
 * is also the first end-to-end proof of `lib/overlap.ts` with two accounts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  A list of LINES, not a list of events
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **That sentence in the brief is a data-shape decision, and this is where it
 * is enforced.** Two people converging on the same capture writes two
 * notification rows; the portal shows **one row, naming both**. So this reads
 * notifications, joins each to *the viewer's own capture for the same
 * possibility*, and groups by that capture before anything is rendered.
 *
 * ⚠ **The join is `payload->>'itemId'`, because the notification does not carry
 * a capture id.** It cannot: `lib/overlap.ts` writes one row per *match*, and a
 * match is about a possibility that two people's captures both point at. The
 * viewer's own capture is the thing the portal draws, and it is found here
 * rather than stored there — which also means a payload written before this
 * existed works unchanged.
 *
 * ⚠ **`inner` join, so a notification whose capture is gone does not surface.**
 * Nothing is ever deleted (§5), so in practice this drops the case where the
 * *possibility* was written by a fan-out and the viewer's capture has since been
 * re-resolved to something else. Silence is the correct rendering of that: the
 * line the sentence was about is not on their page any more.
 */

/** One portal row: the viewer's own line, and what happened to it. */
export type PortalLine = PageLine & {
  /**
   * **The sentence, already written.** The client renders a string.
   *
   * ⚠ **Built on the server because the copy is `lib/overlap.ts`'s**, which is
   * `server-only` and is §6's single owner of everything about a match. A
   * component that assembled this from `kind` and a name would be a second place
   * that knows what a convergence says.
   */
  sentence: string
  /**
   * The rows this line stands for, so opening it can empty them.
   *
   * ⚠ **Ids and not a count.** §5: *never a count* — the portal has no number in
   * it anywhere, and this is a list because the write needs one, not because
   * anything displays its length.
   */
  notificationIds: string[]
}

/**
 * How many notification rows one read considers.
 *
 * §10 forbids an unbounded select and this is that bound. ⚠ **It bounds the
 * NOTIFICATIONS, and the portal's rows are the groups they fall into**, so a
 * portal showing fewer than this many lines is the normal case rather than a
 * short read. A group split across the boundary loses names from its sentence
 * and not the line itself — the acceptable failure of the two, and the reason
 * this is large enough that it needs a genuinely busy week to reach.
 */
export const PORTAL_LIMIT = 100

type Row = {
  notificationId: string
  kind: NotificationKind
  counterpartName: string
  guideHolder: boolean
  captureId: string
  text: string
  /* ⚠ Step C2: the row carries the two axes; `state` is derived in `group`. */
  status: CaptureStatus
  verdict: CaptureVerdict | null
  year: number | null
  createdAt: Date
  hasImage: boolean
  sourceUrl: string | null
  notifiedAt: Date
}

/**
 * **What happened while you were away.** Unread only, newest first.
 *
 * ⚠ **Unread IS the portal's whole state, and there is no second flag.** §5:
 * *it empties; a row you have opened leaves; no mark as read.* So `read_at` is
 * not a read receipt in the messaging sense — it is the row leaving. Opening a
 * line is the only thing that sets it, and nothing sets it in bulk.
 *
 * ⚠ **Ordered by the notification, not by the capture.** The portal answers
 * *what happened while I was away*, so its order is when things happened. The
 * capture underneath may be from March; that is the point of the portal existing
 * at all, and ordering by `captures.created_at` would bury exactly the case §5
 * says a gutter mark alone cannot serve.
 */
export async function listMyPortal(
  sessionUser: SessionUser,
  { limit = PORTAL_LIMIT }: { limit?: number } = {},
): Promise<PortalLine[]> {
  const rows = await db
    .select({
      notificationId: notifications.id,
      kind: notifications.kind,
      /*
        ⚠ **Read out of the payload rather than re-derived from `profiles`.** The
        name in a notification is the name at the moment it fired — `nameFor`
        with `mutual: true`, which is §5's naming rule — and re-joining now would
        quietly restate history if somebody has since changed their display name
        or the track has stopped being mutual. The payload is the record.
      */
      counterpartName: sql<string>`coalesce(${notifications.payload} ->> 'counterpartName', 'Someone')`,
      guideHolder: sql<boolean>`coalesce((${notifications.payload} ->> 'guideHolder')::boolean, false)`,
      captureId: captures.id,
      text: captures.text,
      /* ⚠ Step C2: the two axes, with `state` derived in `group` below. */
      status: captures.status,
      verdict: captures.verdict,
      year: possibilities.year,
      createdAt: captures.createdAt,
      hasImage: sql<boolean>`${captures.imagePath} is not null`,
      sourceUrl: captures.sourceUrl,
      notifiedAt: notifications.createdAt,
    })
    .from(notifications)
    /*
      ⚠ **The capture is the viewer's own, and `eq(captures.userId, …)` is the
      privacy term.** A notification names a counterpart; it must never be a door
      to the counterpart's row. Both sides of a convergence get their own
      notification, so each person's portal is built entirely out of their own
      captures — see §3, this layer is the only place that is enforced.
    */
    .innerJoin(
      captures,
      and(
        eq(captures.userId, sessionUser.id),
        sql`${captures.possibilityId}::text = ${notifications.payload} ->> 'itemId'`,
      ),
    )
    .leftJoin(possibilities, eq(possibilities.id, captures.possibilityId))
    .where(and(eq(notifications.userId, sessionUser.id), isNull(notifications.readAt)))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit)

  return group(rows as Row[])
}

/**
 * Notification rows to portal lines.
 *
 * ⚠ **Grouped here rather than in SQL, and the order is preserved by the map.**
 * A `group by` would have had to aggregate the capture's six columns as well,
 * and the set is bounded by `PORTAL_LIMIT` — so this is a loop over at most a
 * hundred rows against a statement that would need every column named twice.
 *
 * ⚠ **Names are deduplicated and kept in arrival order.** Two people converging
 * on one line is one row saying *Sam and Ali too.*, which is §5's *name
 * everyone* — and the same person converging twice on one line, which the pair
 * fan-out can produce when a track becomes mutual, is one name.
 */
function group(rows: Row[]): PortalLine[] {
  const byCapture = new Map<string, { line: PortalLine; names: Clauses }>()

  for (const row of rows) {
    let entry = byCapture.get(row.captureId)
    if (!entry) {
      entry = {
        line: {
          id: row.captureId,
          text: row.text,
          state: legacyState(row.status, row.verdict),
          year: row.year,
          createdAt: row.createdAt,
          /*
            ⚠ **No offer on a portal line, and it is a `null` written down.** A
            standing question is *this capture may be that possibility*; a
            portal line has already resolved to one, or it could not have
            converged. There is nothing to ask.
          */
          offer: null,
          hasImage: row.hasImage,
          sourceUrl: row.sourceUrl,
          /*
            ⚠ **True by construction, and it is the one place this bit is not
            queried for.** A portal row exists because a notification exists for
            it, so asking the database whether the line converged would be asking
            it to confirm the row it just returned. See `converged` in
            `captures.ts`, which is what answers for every other surface.
          */
          converged: true,
          /*
            ⚠ **True by construction, for the same reason.** A locked capture is
            out of the pool and cannot have produced the notification that put
            this row here — so asking the database would be asking it to confirm
            a row it just returned. See `shared` in `captures.ts`.
          */
          shared: true,
          sentence: '',
          notificationIds: [],
        },
        names: new Map(),
      }
      byCapture.set(row.captureId, entry)
    }
    entry.line.notificationIds.push(row.notificationId)
    clause(entry.names, row.kind, row.guideHolder, row.counterpartName)
  }

  return [...byCapture.values()].map(({ line, names }) => ({
    ...line,
    sentence: say(names),
  }))
}

/**
 * The clauses of one line, in the order they were first said.
 *
 * ⚠ **Keyed by the sentence a pair produces, not by `kind` alone** — the two
 * sides of a `guide` say opposite things, so they cannot share a clause. This is
 * the one place that assembly happens: the portal groups notifications into
 * lines and the mark reads one line's whole history, and both end here so that
 * *Sam and Ali too.* cannot come out two different ways on two surfaces.
 */
type Clauses = Map<string, Set<string>>

function clause(into: Clauses, kind: NotificationKind, guideHolder: boolean, name: string) {
  const key = `${kind}:${guideHolder}`
  const held = into.get(key)
  if (held) held.add(name)
  else into.set(key, new Set([name]))
}

function say(clauses: Clauses): string {
  return [...clauses]
    .map(([key, people]) => {
      const [kind, holder] = key.split(':')
      return portalSentence(kind as NotificationKind, [...people], holder === 'true')
    })
    .join(' ')
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The mark's sentence — Phase 2 step 4, 31 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Why is this line special.** Everything that has ever converged on one
 * capture, said in the portal's own words.
 *
 * ⚠ **No `read_at` term, and that absence is the whole difference from
 * `listMyPortal`.** §5: *the portal is arrival, the mark is memory.* The portal
 * empties as lines are opened; this is what is left afterwards, and it is the
 * only durable answer to *why does this line carry a mark* once the portal has
 * gone quiet. **Do not add an unread filter here to make the two agree** — the
 * disagreement is the design.
 *
 * ⚠ **Read when a console opens, never with the record.** The bit that draws the
 * mark rides the page's own query (`converged` in `captures.ts`); this is one
 * statement for one capture, issued by the console for the line somebody
 * actually tapped. Fifty lines cost fifty `exists`; the names cost nothing until
 * they are looked at.
 *
 * ⚠ **`eq(captures.userId, …)` and `eq(captures.id, …)` together are the privacy
 * term**, and the capture id arrives from a client. Without the user term this
 * is *tell me who converged on any capture id you can guess* — the counterpart's
 * row reached through a notification that only ever named them (§3).
 *
 * Returns `null` for a line nothing has converged on, which is also what an id
 * belonging to somebody else returns. **Silence is the correct rendering of
 * nothing** (§6) — there is no empty state to draw and no absence to explain.
 */
export async function getConvergence(
  sessionUser: SessionUser,
  captureId: string,
): Promise<string | null> {
  const rows = await db
    .select({
      kind: notifications.kind,
      /* The name at the moment it fired — see `listMyPortal` for why. */
      counterpartName: sql<string>`coalesce(${notifications.payload} ->> 'counterpartName', 'Someone')`,
      guideHolder: sql<boolean>`coalesce((${notifications.payload} ->> 'guideHolder')::boolean, false)`,
    })
    .from(notifications)
    .innerJoin(
      captures,
      and(
        eq(captures.id, captureId),
        eq(captures.userId, sessionUser.id),
        sql`${captures.possibilityId}::text = ${notifications.payload} ->> 'itemId'`,
      ),
    )
    .where(eq(notifications.userId, sessionUser.id))
    /*
      ⚠ **Oldest first, where the portal is newest first, and the two orders say
      what each surface is for.** The portal is *what happened while I was away*,
      so it leads with the most recent thing. The mark is a line's history, so it
      names people in the order they arrived on it.
    */
    .orderBy(asc(notifications.createdAt), asc(notifications.id))
    .limit(CONVERGENCE_LIMIT)

  if (rows.length === 0) return null

  const clauses: Clauses = new Map()
  for (const row of rows) clause(clauses, row.kind, row.guideHolder, row.counterpartName)
  return say(clauses)
}

/**
 * §10's bound on this read, and **not** a cut-off on the names.
 *
 * `portalSentence` says there is no cut-off and there must not be one — *Sam and
 * 4 others* is a metric. This is the different thing: the number of rows one
 * statement will consider, so that a line cannot become an unbounded select. The
 * day a capture has a hundred convergences on it, the honest reading is that
 * this app has grown a shape the design did not predict.
 */
const CONVERGENCE_LIMIT = 100

/**
 * **Opening a line empties its rows from the portal.**
 *
 * ⚠ **This is the whole of *it empties*, and it is deliberately not a *mark all
 * read*.** §5 rules that out by name: a portal you can clear in one gesture is a
 * count with extra steps.
 *
 * ⚠ **This said the thing being cleared was the only durable signal a
 * convergence happened *before the mark exists to remember it* — and the mark
 * exists, 31 August.** Emptying is no longer destructive of the last record:
 * `getConvergence` reads these same rows with no `read_at` term and the line
 * keeps its bar. **The rule is unchanged**, because the argument against a
 * *clear all* was never that the signal was scarce.
 *
 * ⚠ **`eq(userId)` is in the `where` and is not decoration.** The ids come from
 * a client. Without it this is an endpoint for marking other people's
 * notifications read — which is not a data leak, and is exactly the class of
 * quiet damage §3 says this layer exists to prevent.
 *
 * Idempotent by construction: setting `read_at` on a row that already has one
 * is a no-op, so a retried submission cannot do anything a first one did not
 * (§10).
 */
export async function readPortalLine(
  sessionUser: SessionUser,
  notificationIds: readonly string[],
): Promise<void> {
  if (notificationIds.length === 0) return

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, sessionUser.id),
        isNull(notifications.readAt),
        inArray(notifications.id, [...notificationIds]),
      ),
    )
}

/* -------------------------------------------------------------------------- */
/*  Requests — the handshake, 4 September                                       */
/* -------------------------------------------------------------------------- */

/**
 * **What makes a request pending, in one place.**
 *
 * ⚠ **The list and the door must never disagree about whether there is anything
 * behind it**, so the predicate is written once and both read it. That is the
 * same rule `hasPortalLines` was written under, applied to a second kind of row.
 *
 * Three terms, and each one is doing a job:
 *
 *   1. **an unread `track_request` addressed to the viewer** — the arrival. It
 *      is what makes a request *noticeable*, and it is why pending is not
 *      derived from `tracks` alone: a mutual pair that later breaks leaves the
 *      asker's row standing, and a derived predicate would resurface it as a
 *      fresh request the viewer already answered once.
 *   2. **their row still exists** — the truth. Somebody who withdrew has
 *      nothing outstanding, and a question with nothing left to answer must not
 *      be asked.
 *   3. **the viewer has not written the reverse row** — answered. Accepting
 *      from `/u/[handle]` rather than from the portal is the case this covers,
 *      and `trackUser` marks the row read in the same transaction, so this term
 *      is belt and braces on purpose.
 *
 * ⚠ **`(payload ->> 'counterpartId')::uuid`, because a notification carries no
 * foreign key and cannot** — the same reasoning as `listMyPortal`'s join on
 * `itemId`. The payload is where a notification says who it is about.
 */
function pendingRequest(viewerId: string) {
  const counterpart = sql`(${notifications.payload} ->> 'counterpartId')::uuid`

  return and(
    eq(notifications.userId, viewerId),
    eq(notifications.kind, 'track_request'),
    isNull(notifications.readAt),
    sql`exists (
      select 1 from ${tracks} asked
      where asked.follower_id = ${counterpart} and asked.followed_id = ${viewerId}
    )`,
    sql`not exists (
      select 1 from ${tracks} answered
      where answered.follower_id = ${viewerId} and answered.followed_id = ${counterpart}
    )`,
  )
}

/** One pending request: who is asking, and the sentence that says so. */
export type TrackRequest = {
  notificationId: string
  /**
   * ⚠ **Read live from `profiles`, NOT from the payload — the one place this
   * file departs from *the payload is the record*.** A convergence's name is
   * history: it is what was said at the time and re-deriving it would restate
   * the past. A pending request is not history, it is **a live question about a
   * person you are about to let in** — and answering it addresses them by
   * handle. A handle that has changed since would name somebody the viewer does
   * not recognise and address somebody who no longer exists.
   */
  handle: string
  /** Already written, by `portalSentence` — the portal's one author. */
  sentence: string
  askedAt: Date
}

/**
 * How many pending requests one read considers. §10 forbids an unbounded
 * select; this is that bound. It is smaller than `PORTAL_LIMIT` because a
 * request is a person and the mechanic assumes small clusters (§10's scale
 * note) — fifty people asking at once is not a busy week, it is a different
 * app.
 */
export const REQUEST_LIMIT = 50

/**
 * **Who has added you and is waiting.**
 *
 * ⚠ **A second read rather than a widening of `listMyPortal`.** That statement
 * inner-joins the viewer's own captures on `payload->>'itemId'`, and that join
 * carries the privacy term — a notification names a counterpart and must never
 * be a door to the counterpart's row. A request has no `itemId`, so it is
 * invisible there **by construction**, which is the right way for it to be
 * invisible. **Do not relax that join to let this through.**
 *
 * ⚠ **The rows are not grouped.** A portal line is a group because two people
 * can converge on one capture; two people asking is two questions, each with
 * its own answer. Grouping them would be one row that could only be answered
 * one way.
 */
export async function listMyRequests(
  sessionUser: SessionUser,
  { limit = REQUEST_LIMIT }: { limit?: number } = {},
): Promise<TrackRequest[]> {
  const rows = await db
    .select({
      notificationId: notifications.id,
      handle: profiles.handle,
      askedAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(
      profiles,
      sql`${profiles.id} = (${notifications.payload} ->> 'counterpartId')::uuid`,
    )
    .where(pendingRequest(sessionUser.id))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit)

  return rows.map((row) => ({
    ...row,
    /*
      ⚠ **`@handle` and never a name, and `portalSentence` is still the author.**
      §5: a name is for people who know you. Somebody who has only asked does
      not, which is exactly what makes the `@` the honest thing to show — you
      are being asked by a handle, and accepting is what turns it into a name.
    */
    sentence: portalSentence('track_request', [`@${row.handle}`]),
  }))
}

/** What is behind the door — one bit per kind of row, and never a number. */
export type PortalWaiting = {
  /** Convergences: things that happened, which leave on being read. */
  lines: boolean
  /** Requests: things to answer, which leave on being answered. */
  requests: boolean
}

/**
 * **Two bits: what kind of thing is waiting, if anything.**
 *
 * ⚠ **`exists`, never `count`.** §5 forbids a number in the portal and the door
 * is where a number would have crept in first — a badge is the most natural
 * thing in the world to write and it is an engagement metric with a different
 * name. Booleans are all the glyph can say, and a function that returned counts
 * would be one refactor away from displaying them.
 *
 * ⚠⚠ **ONE FUNCTION RATHER THAN TWO OR'D BY A PAGE.** *Is there anything behind
 * me* is the door's question and the answer must come from one place — if a
 * caller had to remember to ask twice, the day somebody adds a third kind of row
 * is the day the portal holds something with an unlit door and no error
 * anywhere. Two statements in parallel, both bits out.
 *
 * ⚠ **It returned a single boolean until 4 September and the door now says
 * WHICH** — `C`, `R`, or `C/R`. Directed: a request needs answering and a
 * convergence does not, and a door that says only *something* makes the reader
 * open it to find out which. **That is still not a count**: three states, no
 * digits, and two people asking is the same `R` as one.
 */
export async function portalWaiting(sessionUser: SessionUser): Promise<PortalWaiting> {
  const [lines, requests] = await Promise.all([
    db
      .select({ one: sql<number>`1` })
      .from(notifications)
      .innerJoin(
        captures,
        and(
          eq(captures.userId, sessionUser.id),
          sql`${captures.possibilityId}::text = ${notifications.payload} ->> 'itemId'`,
        ),
      )
      .where(and(eq(notifications.userId, sessionUser.id), isNull(notifications.readAt)))
      .limit(1),

    db
      .select({ one: sql<number>`1` })
      .from(notifications)
      .where(pendingRequest(sessionUser.id))
      .limit(1),
  ])

  return { lines: lines.length > 0, requests: requests.length > 0 }
}
