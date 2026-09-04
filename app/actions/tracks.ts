'use server'

import { refresh } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'

import {
  declineTrack,
  getProfileByHandle,
  requireSessionUser,
  trackUser,
  untrackUser,
  type TrackState,
} from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * Tracking, from `/u/[handle]`. Thin, delegating to `lib/db/tracks.ts` (§3), and
 * re-verifying auth because a Server Action is its own entry point.
 *
 * Both actions take a **handle** rather than a user id. That is not politeness:
 * a handle is what the caller was shown, and it is the only identifier §2 lets
 * anyone hold for a person they have not been introduced to. Resolving it here
 * means a client never learns a uuid it could iterate.
 */

export type TrackResult = { ok: true; state: TrackState } | { ok: false; message: string }

const schema = z.object({ handle: z.string().min(2).max(40) })

async function resolveTarget(
  handle: unknown,
): Promise<
  | { ok: true; viewer: Awaited<ReturnType<typeof requireSessionUser>>; targetId: string }
  | { ok: false; message: string }
> {
  const viewer = await requireSessionUser()

  const parsed = schema.safeParse({ handle })
  if (!parsed.success) return { ok: false, message: 'No such person.' }

  /*
    Both identifiers, as everywhere else in the app: per user so one account
    cannot spend the whole budget, and per IP so signing up repeatedly does not
    reset it. The bucket exists because becoming mutual writes notifications to
    somebody else — see LIMITS.track.
  */
  for (const identifier of [viewer.id, clientIp(await headers())]) {
    const limit = await rateLimit('track', identifier)
    if (!limit.ok) return { ok: false, message: 'Slow down a moment.' }
  }

  const target = await getProfileByHandle(viewer, parsed.data.handle)
  if (!target) return { ok: false, message: 'No such person.' }

  return { ok: true, viewer, targetId: target.id }
}

export async function trackAction(handle: string): Promise<TrackResult> {
  const resolved = await resolveTarget(handle)
  if (!resolved.ok) return resolved

  const result = await trackUser(resolved.viewer, resolved.targetId)
  if (!result.ok) return { ok: false, message: result.message }

  // The page shows their list and their state; both change on tracking.
  refresh()
  return { ok: true, state: result.value }
}

export async function untrackAction(handle: string): Promise<TrackResult> {
  const resolved = await resolveTarget(handle)
  if (!resolved.ok) return resolved

  const result = await untrackUser(resolved.viewer, resolved.targetId)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, state: result.value }
}

/**
 * **Decline a request** — the No half of the portal's question.
 *
 * ⚠ **There is no `acceptAction`, and that is the design rather than an
 * omission.** Accepting is adding them back, which is `trackAction` above:
 * the same call, from a different surface, running the same fan-out on the
 * transition into mutuality. A second entry point would be a second place that
 * decides what mutuality means.
 *
 * ⚠ **By handle, like everything else here**, so a client never learns a uuid it
 * could iterate. The portal hands the handle down for exactly this reason.
 *
 * It shares the `track` bucket. Declining costs nobody else anything — nothing
 * is written to another person — but it deletes a row from a request body, and
 * an unbounded endpoint that deletes rows wants a ceiling whatever its blast
 * radius.
 */
export async function declineAction(handle: string): Promise<TrackResult> {
  const resolved = await resolveTarget(handle)
  if (!resolved.ok) return resolved

  const result = await declineTrack(resolved.viewer, resolved.targetId)
  if (!result.ok) return { ok: false, message: result.message }

  refresh()
  return { ok: true, state: result.value }
}
