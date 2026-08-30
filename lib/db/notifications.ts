import 'server-only'

import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { db } from './client'
import { captures, notifications, possibilities } from './schema'
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
  state: PageLine['state']
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
      state: captures.state,
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
  const byCapture = new Map<string, { line: PortalLine; names: Map<string, Set<string>> }>()

  for (const row of rows) {
    let entry = byCapture.get(row.captureId)
    if (!entry) {
      entry = {
        line: {
          id: row.captureId,
          text: row.text,
          state: row.state,
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
          sentence: '',
          notificationIds: [],
        },
        names: new Map(),
      }
      byCapture.set(row.captureId, entry)
    }
    entry.line.notificationIds.push(row.notificationId)
    /*
      Keyed by the sentence the pair produces, not by `kind` alone: the two sides
      of a `guide` say opposite things, so they cannot share a clause.
    */
    const key = `${row.kind}:${row.guideHolder}`
    const held = entry.names.get(key)
    if (held) held.add(row.counterpartName)
    else entry.names.set(key, new Set([row.counterpartName]))
  }

  return [...byCapture.values()].map(({ line, names }) => ({
    ...line,
    sentence: [...names]
      .map(([key, people]) => {
        const [kind, holder] = key.split(':')
        return portalSentence(kind as NotificationKind, [...people], holder === 'true')
      })
      .join(' '),
  }))
}

/**
 * **Opening a line empties its rows from the portal.**
 *
 * ⚠ **This is the whole of *it empties*, and it is deliberately not a *mark all
 * read*.** §5 rules that out by name: a portal you can clear in one gesture is a
 * count with extra steps, and the thing being cleared is the only durable signal
 * that a convergence happened before the mark exists to remember it.
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

/**
 * **One bit: is there anything, or nothing.**
 *
 * ⚠ **`exists`, not `count`.** §5 forbids a number in the portal and the door
 * is where a number would have crept in first — a badge is the most natural
 * thing in the world to write and it is an engagement metric with a different
 * name. This returns a boolean because a boolean is all the glyph can say, and
 * a function that returned a count would be one refactor away from displaying
 * one.
 */
export async function hasPortalLines(sessionUser: SessionUser): Promise<boolean> {
  const rows = await db
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
    .limit(1)

  return rows.length > 0
}
