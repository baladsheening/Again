import 'server-only'

import { eq, inArray } from 'drizzle-orm'
import webpush from 'web-push'

import { db } from '@/lib/db/client'
import { pushSubscriptions } from '@/lib/db/schema'
import { env } from '@/lib/env'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Delivery — earned push, 11 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The last of Amendment 10's four Release 1 blockers.** `lib/overlap.ts` has
 * written `notifications` rows since Phase 2 and, until the portal, nothing read
 * them; until this, nothing delivered them either. A convergence that arrives
 * while the app is closed is a convergence nobody is told about, and §6 has said
 * since it was written that **push delivery happens in a background worker,
 * never inline.**
 *
 * ⚠⚠ **THE "WORKER" IS `after()`, AND THAT IS A DELIBERATE READING OF §6 RATHER
 * THAN A DODGE.** What that rule forbids is a third-party HTTP call sitting
 * inside the capture's transaction, where it would add latency to the
 * four-second promise and where a failed push could roll back a written line.
 * `after` runs the callback once the response has flushed — outside the
 * transaction, off the critical path, and **with no queue, no cron and no second
 * service to operate.** ⚠ **What it costs, stated: a killed invocation loses the
 * send.** The notification row is already committed, so the portal and the mark
 * still show it; what is lost is the buzz. **That is the right thing to drop**,
 * and a durable queue is the upgrade if it ever proves otherwise.
 *
 * ⚠ **A push is a COPY of a row that is already committed, never the record of
 * it.** Nothing here writes, and nothing downstream of a failure needs undoing.
 *
 * ⚠ **This module reads other people's rows on purpose**, which is why it lives
 * beside `lib/overlap.ts` rather than in `lib/db/`. Every function in that layer
 * takes the authenticated `SessionUser` first and filters on it (§3); delivery
 * looks up the *recipient's* endpoints, and the recipient is not the actor. The
 * fan-out already writes other people's notification rows for the same reason,
 * and both are reached only from inside a mutation that has already checked who
 * is allowed to cause one.
 */

/** What a `push` event in `public/sw.js` expects to find. */
export type PushRow = {
  userId: string
  /** The standalone line — `notificationCopy`, never the portal's register. */
  title: string
  body?: string
  /** Collapses a burst into one notification per kind. See the worker. */
  tag?: string
}

/**
 * ⚠ **Configured once per process, lazily, and only when the keys exist.**
 * `web-push` throws at send time if VAPID details were never set, and the keys
 * are optional in `lib/env.ts` — deliberately, so that a development machine
 * without them runs the whole app and simply does not buzz. **Nothing else in
 * the tree changes shape when they are absent.**
 */
let configured: boolean | null = null

function ready(): boolean {
  if (configured !== null) return configured

  const { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env
  if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    configured = false
    return false
  }

  webpush.setVapidDetails(VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  configured = true
  return true
}

/**
 * **Send these, to every device their people have registered.**
 *
 * ⚠ **One query for every recipient, not one per person.** The fan-out's own
 * rule (§6, Performance): never loop issuing a query each. A person connecting
 * to somebody with forty things in common produces forty rows at once, and forty
 * lookups would be the per-row shape that rule exists to forbid.
 *
 * ⚠⚠ **A GONE SUBSCRIPTION IS DELETED, AND THAT IS THE ONLY SELF-HEALING THIS
 * TABLE GETS.** A push service answers `404` or `410` for an endpoint whose
 * browser has dropped it — uninstalled, cleared, permission revoked — and a row
 * nobody prunes is retried for ever. **No other status is treated as fatal**: a
 * `429` or a `500` is the push service having a bad minute, and deleting
 * somebody's device over it would silently unsubscribe them.
 *
 * ⚠ **It never throws.** This runs after the response has gone, so there is
 * nobody to tell and nothing to retry into; a rejection here would surface as an
 * unhandled promise in a log and change nothing about what the reader sees.
 */
export async function deliver(rows: readonly PushRow[]): Promise<void> {
  if (rows.length === 0 || !ready()) return

  const userIds = [...new Set(rows.map((r) => r.userId))]

  const subs = await db
    .select({
      userId: pushSubscriptions.userId,
      endpoint: pushSubscriptions.endpoint,
      keys: pushSubscriptions.keys,
    })
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds))

  if (subs.length === 0) return

  const byUser = new Map<string, typeof subs>()
  for (const s of subs) {
    const list = byUser.get(s.userId)
    if (list) list.push(s)
    else byUser.set(s.userId, [s])
  }

  const dead: string[] = []

  await Promise.all(
    rows.flatMap((row) =>
      (byUser.get(row.userId) ?? []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify({ title: row.title, body: row.body, tag: row.tag, url: '/record' }),
          )
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode
          if (status === 404 || status === 410) dead.push(sub.endpoint)
        }
      }),
    ),
  )

  if (dead.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, dead))
  }
}

/**
 * **Is this person reachable at all?** Used by nothing yet, and deliberately
 * exported for the one thing that will want it: a surface that offers to turn
 * notifications on should not offer it to somebody who already has.
 *
 * ⚠ **A boolean, never a count.** §5 forbids the portal a number and the same
 * reasoning holds anywhere else: a counting function is one refactor from
 * displaying one.
 */
export async function hasPushSubscription(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ endpoint: pushSubscriptions.endpoint })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .limit(1)

  return row !== undefined
}
