import 'server-only'

import { and, eq } from 'drizzle-orm'

import { db } from './client'
import { pushSubscriptions } from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Where a device says it can be reached — earned push, 11 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **`push_subscriptions` has existed since Phase 2 with zero readers and zero
 * writers.** It was declared by somebody thinking ahead and has been a table
 * nothing touched; this is the module that finally uses it.
 *
 * ⚠ **Amendment 10 moved push into Release 1, and `lib/env.ts` still says Phase
 * 6.** That comment is not wrong about what it was written for — Phase 6 gates
 * **stranger** matching behind adult eligibility, blocking, reporting and
 * moderation. **None of that is in the path here**: a push only ever fires for a
 * convergence or a request between two people who are already mutually tracked,
 * or who have already asked. *An earned service-notification path belongs in
 * Release 1* — Amendment 10, in those words.
 *
 * ⚠ **The writes are session-filtered, as §3 requires; the READ is not here.**
 * Delivery has to look up the *recipient's* endpoints, and the recipient is not
 * the session user — so that read lives in `lib/push.ts` beside the fan-out that
 * already writes other people's notification rows, and it takes an executor
 * rather than a `SessionUser`. **Putting it in this module would mean a
 * `lib/db/` function whose first argument is somebody else**, which is the one
 * shape the boundary exists to forbid.
 */

/**
 * **One device, remembered.**
 *
 * ⚠ **The endpoint is the identity, not the user.** A person has as many rows
 * as they have browsers, and the same person re-subscribing in the same browser
 * gets the same endpoint back — so this is an upsert on the composite key the
 * table already declares, and re-granting permission cannot accumulate
 * duplicates that would each be pushed to.
 *
 * ⚠ **The keys are stored verbatim.** `p256dh` and `auth` are the browser's own
 * ECDH material; the server encrypts to them and never reads them itself.
 * Rewriting or re-encoding either is a push that fails with a 400 nobody sees.
 */
export async function savePushSubscription(
  sessionUser: SessionUser,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<Result<null>> {
  const { endpoint, keys } = subscription
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return err('invalid', 'That subscription is missing something.')
  }

  await db
    .insert(pushSubscriptions)
    .values({ userId: sessionUser.id, endpoint, keys })
    .onConflictDoUpdate({
      target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
      set: { keys },
    })

  return ok(null)
}

/**
 * **This device says stop.**
 *
 * ⚠ **Scoped to the session user AND the endpoint**, so nobody can unsubscribe
 * a device that is not theirs by guessing a string. The endpoint is a URL a
 * push service issued and is not secret in any useful sense; the user filter is
 * what makes that not matter.
 *
 * ⚠ **Silent when there is no row.** Turning off something already off is not a
 * failure, and a browser that has already dropped its subscription will call
 * this with an endpoint the table never held.
 */
export async function removePushSubscription(
  sessionUser: SessionUser,
  endpoint: string,
): Promise<Result<null>> {
  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, sessionUser.id),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    )

  return ok(null)
}
