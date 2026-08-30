'use server'

import { z } from 'zod'

import { listMyPortal, readPortalLine, requireSessionUser, PORTAL_LIMIT } from '@/lib/db'
import { dayStamper } from '@/lib/day'
import { toPageLines, type PageLineView } from '@/lib/page-line'
import { viewerTimeZone } from '@/lib/region'
import type { ActionResult } from './entries'

/**
 * **The portal's two actions: read it, and empty a line out of it.**
 *
 * ⚠ **Auth is re-verified in each one**, because a Server Action is its own
 * entry point and the route's check does not cover it — the same rule the
 * capture actions state. Everything below `requireSessionUser` delegates to
 * `lib/db/notifications.ts`, which filters on that user; §3 holds because it is
 * the only place these tables are touched.
 */

/** A portal row, as the client gets it: a line of the record, and the sentence. */
export type PortalLineView = PageLineView & {
  sentence: string
  notificationIds: string[]
}

/**
 * **What happened while you were away.**
 *
 * ⚠ **Fetched when the portal opens, not handed down with the page.** The one
 * bit — *is there anything* — comes with the document, because the glyph has to
 * be right on the first paint. The rows do not: they are a list nobody is
 * looking at until they ask, and putting them in the route's payload would put
 * a join to `notifications` in front of every capture, on the one screen whose
 * whole promise is that Return lands in under a frame.
 *
 * ⚠ **A read, so no rate limit and no mutation id** — the same reasoning as
 * `earlierAction`. The worst a loop of these does is read somebody their own
 * page back to them.
 *
 * ⚠ **Stamped here, with `toPageLines`, exactly as the route and *Earlier*
 * are.** Three producers of one view shape now, and the mapper is still the only
 * way to make one — so a portal row and a record row can never disagree about
 * which day they belong to. See `lib/day.ts` for why the client never formats.
 */
export async function portalAction(): Promise<ActionResult<PortalLineView[]>> {
  const sessionUser = await requireSessionUser()

  const rows = await listMyPortal(sessionUser, { limit: PORTAL_LIMIT })
  const { stamp } = dayStamper(new Date(), (await viewerTimeZone()) ?? undefined)

  /*
    `toPageLines` takes the row's own shape and drops what the record does not
    display, so the two portal-only fields are put back by position. Zipping is
    safe because the mapper is a `map` — one line out per row in, in order — and
    it is preferable to widening `Stampable` with fields the record has no use
    for.
  */
  const lines = toPageLines(rows, stamp)
  return {
    ok: true,
    value: lines.map((line, i) => ({
      ...line,
      sentence: rows[i].sentence,
      notificationIds: rows[i].notificationIds,
    })),
  }
}

/**
 * ⚠ **A bound on the ids, because they arrive from a client.** One portal row
 * stands for as many notifications as there are people on it, and `PORTAL_LIMIT`
 * is the most the read can have handed out — so anything longer did not come
 * from a portal this app drew.
 */
const emptySchema = z.array(z.string().uuid()).min(1).max(PORTAL_LIMIT)

/**
 * **Opening a line empties it. That is the whole of *no mark as read*.**
 *
 * §5: the portal empties, and a row you have opened leaves. There is
 * deliberately no *clear all* — a portal you can dismiss in one gesture is a
 * count with extra steps, and this is the only signal a convergence happened
 * until the gutter mark exists to remember it.
 *
 * ⚠ **It cannot fail visibly and does not try.** The row has already gone from
 * the screen by the time this returns; a message saying the emptying failed
 * would be a second thing to understand about a surface whose entire content is
 * one sentence. The rows stay unread and the portal shows them again next time,
 * which is the correct behaviour for a write that did not land.
 */
export async function emptyPortalLineAction(
  notificationIds: string[],
): Promise<ActionResult> {
  const sessionUser = await requireSessionUser()

  const parsed = emptySchema.safeParse(notificationIds)
  if (!parsed.success) return { ok: false, message: 'Unknown line.' }

  await readPortalLine(sessionUser, parsed.data)
  return { ok: true, value: null }
}
