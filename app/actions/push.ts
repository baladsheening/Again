'use server'

import { z } from 'zod'

import { getSessionUser, removePushSubscription, savePushSubscription } from '@/lib/db'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Turning notifications on — earned push, 11 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Two actions, and neither of them sends anything.** Delivery is
 * `lib/push.ts`, reached from the fan-out after a response has flushed; these
 * only record where a device says it can be reached.
 *
 * ⚠ **Zod at the boundary (§10), and it is not ceremony here.** What arrives is
 * a `PushSubscription` the browser serialised, so the shape is the browser's
 * rather than ours — and a missing `keys.p256dh` is a row that fails at send
 * time, weeks later, in a callback nobody is watching. It is checked where it
 * crosses.
 */

const subscription = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
})

/**
 * ⚠ **`Result`, not a throw**, like every other mutation in this app. A failure
 * here is expected rather than exceptional — a browser can hand back a
 * subscription the moment permission is revoked — and the caller decides what to
 * draw, which in the portal's case is nothing at all.
 */
export async function subscribeAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { ok: false, message: 'Sign in first.' }

  const parsed = subscription.safeParse(raw)
  if (!parsed.success) return { ok: false, message: 'That subscription is missing something.' }

  const result = await savePushSubscription(sessionUser, parsed.data)
  return result.ok ? { ok: true } : { ok: false, message: result.message }
}

/**
 * ⚠ **The endpoint identifies the device, and the session identifies the
 * person.** Both are required — the data layer filters on the session user, so
 * a guessed endpoint reaches nothing that is not already yours.
 */
export async function unsubscribeAction(
  endpoint: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { ok: false, message: 'Sign in first.' }

  const parsed = z.string().url().max(2048).safeParse(endpoint)
  if (!parsed.success) return { ok: false, message: 'No such subscription.' }

  const result = await removePushSubscription(sessionUser, parsed.data)
  return result.ok ? { ok: true } : { ok: false, message: result.message }
}
