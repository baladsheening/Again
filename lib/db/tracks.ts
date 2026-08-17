import 'server-only'

import { and, desc, eq, sql } from 'drizzle-orm'

import { db } from './client'
import { profiles, tracks } from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'
import { runOverlapForNewMutual } from '@/lib/overlap'
import type { PersonRef } from '@/lib/domain'

/**
 * Tracking. Asymmetric by design (§5): one row is *I follow you*, and mutuality
 * is two rows.
 *
 * Mutuality is doing three jobs, which is why it is worth naming rather than
 * inlining as a pair of booleans:
 *
 *   1. §6 only fans overlap out across mutual tracks.
 *   2. §5's identity rule — names for people who know you, handles for
 *      strangers — reads "knowing someone" as a mutual track. See `nameFor` in
 *      `lib/domain.ts`.
 *   3. It is the moment the second trigger fires. See `trackUser`.
 */

/** Both directions of one relationship, from the viewer's side. */
export type TrackState = {
  /** The viewer tracks them. */
  outbound: boolean
  /** They track the viewer. */
  inbound: boolean
  /** Both. */
  mutual: boolean
}

/**
 * One statement for both directions. Two `exists` sub-selects against the
 * primary key and the reverse index respectively — the same pair of indexes the
 * §6 self-join uses, so this adds no index of its own.
 */
export async function getTrackState(
  viewer: SessionUser,
  otherUserId: string,
): Promise<TrackState> {
  if (otherUserId === viewer.id) {
    // You cannot track yourself, so the relationship is not merely absent — it
    // is undefined. Answering `false` to all three keeps every caller's branch
    // honest without a special case of its own.
    return { outbound: false, inbound: false, mutual: false }
  }

  const [row] = await db
    .select({
      outbound: sql<boolean>`exists (
        select 1 from ${tracks}
        where ${tracks.followerId} = ${viewer.id} and ${tracks.followedId} = ${otherUserId}
      )`,
      inbound: sql<boolean>`exists (
        select 1 from ${tracks}
        where ${tracks.followerId} = ${otherUserId} and ${tracks.followedId} = ${viewer.id}
      )`,
    })
    .from(sql`(select 1) as one`)

  const outbound = row?.outbound ?? false
  const inbound = row?.inbound ?? false

  return { outbound, inbound, mutual: outbound && inbound }
}

/** A person the viewer tracks, named by §5's rule. */
export type TrackedPerson = PersonRef & {
  userId: string
  /** When the viewer started tracking them. */
  since: Date
}

/**
 * Who the viewer tracks. Paginated (§10) — this is a list, and the whole point
 * of §13's density argument is that it gets long.
 *
 * `mutual` is computed here rather than left to the caller, because it is the
 * input to `nameFor` and a caller that works it out itself is a second copy of
 * the identity rule.
 *
 * There is no "who tracks me" list, and that is not an omission. Nothing in the
 * product needs it, an inbound-only track carries no visibility, and a list of
 * people watching you is a follower count — which is the §2 shape the whole
 * design avoids.
 */
export async function listMyTracks(
  viewer: SessionUser,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<TrackedPerson[]> {
  const reverse = sql`exists (
    select 1 from ${tracks} back
    where back.follower_id = ${tracks.followedId} and back.followed_id = ${viewer.id}
  )`

  const rows = await db
    .select({
      userId: profiles.id,
      handle: profiles.handle,
      displayName: profiles.displayName,
      mutual: sql<boolean>`${reverse}`,
      since: tracks.createdAt,
    })
    .from(tracks)
    .innerJoin(profiles, eq(profiles.id, tracks.followedId))
    .where(eq(tracks.followerId, viewer.id))
    .orderBy(desc(tracks.createdAt))
    .limit(limit)
    .offset(offset)

  return rows
}

/**
 * Start tracking someone.
 *
 * Idempotent (§10): tracking someone you already track is a no-op, not a second
 * row and — importantly — **not a second fan-out**. `onConflictDoNothing` on the
 * composite primary key decides that, so the guarantee is the constraint rather
 * than a check that could be forgotten.
 *
 * ⚠ **This is where the §6 fan-out gets its second trigger.** The overlap
 * mechanism only ran on entry insert and state change, so two people who already
 * held matching wants and *then* tracked each other produced nothing — the
 * seed-time case in §13, and therefore the app's first impression. The call
 * below closes it, scoped to this one pair, using the same module (see
 * `runOverlapForNewMutual`).
 *
 * It fires **only on the transition into mutuality**: this insert created a row
 * *and* the reverse row already existed. An already-mutual pair re-tracking
 * cannot reach it, because the insert is a no-op.
 *
 * The track row and its notifications share one transaction (§10), so a pair can
 * never be mutual with the overlap half missing.
 */
export async function trackUser(
  viewer: SessionUser,
  targetUserId: string,
): Promise<Result<TrackState>> {
  if (targetUserId === viewer.id) {
    return err('invalid', 'You cannot track yourself.')
  }

  return db.transaction(async (tx) => {
    /*
      Both profiles in one read, and it is not only a validation: the fan-out
      names people in its notification payloads, so it needs the handle and
      display name of both sides anyway.
    */
    const people = await tx
      .select({
        id: profiles.id,
        handle: profiles.handle,
        displayName: profiles.displayName,
      })
      .from(profiles)
      .where(sql`${profiles.id} in (${viewer.id}, ${targetUserId})`)

    const me = people.find((p) => p.id === viewer.id)
    const them = people.find((p) => p.id === targetUserId)

    // A viewer with no profile has not finished onboarding. `not_found` rather
    // than `forbidden`: there is nothing to authorise yet.
    if (!me) return err('not_found', 'Finish setting up your profile first.')
    if (!them) return err('not_found', 'No such person.')

    const [inserted] = await tx
      .insert(tracks)
      .values({ followerId: viewer.id, followedId: targetUserId })
      .onConflictDoNothing({ target: [tracks.followerId, tracks.followedId] })
      .returning()

    const [back] = await tx
      .select({ followerId: tracks.followerId })
      .from(tracks)
      .where(
        and(eq(tracks.followerId, targetUserId), eq(tracks.followedId, viewer.id)),
      )
      .limit(1)

    const mutual = Boolean(back)

    if (inserted && mutual) {
      await runOverlapForNewMutual(
        tx,
        { userId: viewer.id, handle: me.handle, displayName: me.displayName },
        { userId: them.id, handle: them.handle, displayName: them.displayName },
      )
    }

    return ok({ outbound: true, inbound: mutual, mutual })
  })
}

/**
 * Stop tracking someone.
 *
 * ⚠ **This deletes a row, and §5's "nothing is ever deleted" is not violated.**
 * That rule is about entries: resolving one changes its state because *having
 * wanted something remains true* — the history is the point. A track is not a
 * record of an event, it is a live statement about who may see your list, and a
 * statement you cannot withdraw is not a statement. There is no state a
 * withdrawn track could sit in that would not also be a list of people you
 * stopped following, which is a worse thing to keep than the row.
 *
 * Idempotent: untracking someone you do not track succeeds. The caller asked for
 * a state, and the state holds.
 *
 * No fan-out. Overlap fires on convergence, never on its loss — §6 has no
 * notification for a match going away and should not get one.
 */
export async function untrackUser(
  viewer: SessionUser,
  targetUserId: string,
): Promise<Result<TrackState>> {
  await db
    .delete(tracks)
    .where(
      and(eq(tracks.followerId, viewer.id), eq(tracks.followedId, targetUserId)),
    )

  const [back] = await db
    .select({ followerId: tracks.followerId })
    .from(tracks)
    .where(and(eq(tracks.followerId, targetUserId), eq(tracks.followedId, viewer.id)))
    .limit(1)

  return ok({ outbound: false, inbound: Boolean(back), mutual: false })
}
