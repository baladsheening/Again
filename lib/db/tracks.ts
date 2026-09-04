import 'server-only'

import { and, desc, eq, isNull, sql } from 'drizzle-orm'

import { db } from './client'
import { notifications, profiles, tracks } from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'
import { runOverlapForNewMutual } from '@/lib/overlap'
import { nameFor, type PersonRef } from '@/lib/domain'

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
 *
 * ⚠⚠ **AND THE FOURTH JOB, 4 SEPTEMBER: A ONE-SIDED TRACK IS A PENDING
 * REQUEST.** Read the three consumers above together and an outbound-only row
 * grants **nothing** — not visibility, not a name, not a convergence. Its whole
 * effect is that *if the other person does the same thing, both become mutual.*
 * That is a request in every respect except the one that matters: **it was
 * never handed to the person it is addressed to.**
 *
 * So the fix is a delivery, not a new object. There is **no pending column, no
 * requests table and no state machine** — see
 * `docs/re-direction/the-handshake.md` §1. Adding somebody writes the row it
 * always wrote and now also writes them a notification; accepting is
 * `trackUser` in the other direction, unchanged, fan-out included; declining is
 * `declineTrack` below.
 *
 * ⚠ **The screen says ADD and this file goes on saying TRACK — directed.** §4
 * makes the vocabulary load-bearing in identifiers as well as copy; this is the
 * one place the two are deliberately split, because the **relation** is a track
 * and only the **act of asking for one** is called adding. The sentence lives
 * in `portalSentence`.
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
      /*
        ⚠ **Accepting answers the request, and that is what this line is.** The
        row that put a question in their asker's portal — theirs, addressed to
        the viewer — has just been answered by the only answer that writes a
        row. It leaves the portal because the portal is unread notifications,
        and nothing else marks it: `readPortalLine` is for convergence lines,
        and a request answered by the button on `/u/[handle]` never touches one.

        Scoped by counterpart as well as by kind, so accepting one person's
        request cannot silently clear another's.
      */
      await tx
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, viewer.id),
            eq(notifications.kind, 'track_request'),
            isNull(notifications.readAt),
            sql`${notifications.payload} ->> 'counterpartId' = ${targetUserId}`,
          ),
        )

      await runOverlapForNewMutual(
        tx,
        { userId: viewer.id, handle: me.handle, displayName: me.displayName },
        { userId: them.id, handle: them.handle, displayName: them.displayName },
      )
    } else if (inserted) {
      /*
        ────────────────────────────────────────────────────────────────────────
         The delivery — 4 September
        ────────────────────────────────────────────────────────────────────────

        **The branch that used to do nothing.** A row was written, the pair is
        not mutual, and until now that was the end of it: the offer sat in the
        table and the person it was addressed to was never told. Two accounts
        holding the same film, no tracks, no notifications — §9 of
        `phase-2-convergence.md`.

        ⚠ **In the same transaction as the row (§10)**, so a track can never
        exist with its request missing, and a request can never name a track
        that was rolled back.

        ⚠ **Idempotent by the CONSTRAINT, not by a check.** `inserted` is null
        when `onConflictDoNothing` fired, so asking twice writes no second ping
        — the same guarantee that already stops a second fan-out, reused rather
        than restated.

        ⚠ **This is the first notification written outside `lib/overlap.ts`, and
        §6's single-owner rule is not broken.** That rule owns everything about a
        **match** — classification, suppression, the copy for both registers. A
        request is not a match: there is no possibility, no intent pair and
        nothing to suppress. What the two share is the sentence, and that is
        still `lib/overlap.ts`'s, beside the six it must not drift from.

        ⚠ **The payload carries NO `itemId`, and that is what keeps it out of the
        portal's line read.** `listMyPortal` and `hasPortalLines` inner-join the
        viewer's captures on `payload->>'itemId'` — the join that carries the
        privacy term — so a request is invisible to both by construction rather
        than by a filter somebody has to remember. See `listMyRequests`.

        ⚠ **`@handle`, never a display name.** §5: a name is for people who know
        you, and somebody who has only been asked does not yet. `nameFor` with
        `mutual: false` is the one author of that.
      */
      await tx.insert(notifications).values({
        userId: targetUserId,
        kind: 'track_request',
        payload: {
          counterpartId: viewer.id,
          counterpartName: nameFor({
            handle: me.handle,
            displayName: me.displayName,
            mutual: false,
          }),
        },
      })
    }

    return ok({ outbound: true, inbound: mutual, mutual })
  })
}

/**
 * **Decline a request: delete the row that asked.**
 *
 * ⚠⚠ **THE ONLY PLACE IN THIS APP WHERE ONE PERSON DELETES ANOTHER PERSON'S
 * ROW, AND THE `where` IS THE WHOLE SAFETY ARGUMENT.** `followedId = viewer.id`
 * is not a filter for correctness — it is the guarantee that this can only ever
 * remove a track **pointing at the person calling it**. There is deliberately
 * no parameter that could widen it, exactly as `listEntriesForOtherUser` has no
 * `includeArchive` flag (§3).
 *
 * ⚠ **It remembers nothing, on `untrackUser`'s own reasoning:** there is no
 * state a declined request could sit in that would not also be a list of people
 * you turned down, which is a worse thing to keep than the row. **What it costs
 * is that a declined person can ask again**, and the honest answer to that is a
 * block list, which does not exist — §8 puts block, report and unmatch behind
 * Phase 6. `LIMITS.track` is what stands in front of it today, and a lower
 * number is not the fix (`docs/re-direction/the-handshake.md` §2b).
 *
 * ⚠ **The asker is never told.** Their button reads *Add* again, exactly as it
 * would for somebody they had never asked. §6's silence rule, and the kind
 * reading of it.
 *
 * ⚠ **This claimed a decline was *indistinguishable* from an unanswered
 * request on the asker's side, and that was only ever true of the BUTTON —
 * corrected 4 September.** People on `/profile` is built from `listMyTracks`,
 * which reads the asker's outbound rows: unanswered is a row tagged
 * *Requested*, and declined is **no row at all**. So the fact leaks by an
 * absence while the word is withheld. It is left that way deliberately —
 * telling them costs either an eighth notification kind, which is a rejection
 * with a timestamp on it, or a tombstone column, which is the pending state
 * machine §1 of the handshake proved unnecessary **and** would break re-asking,
 * since `onConflictDoNothing` makes a second ask over a surviving row a silent
 * no-op that writes no notification. Re-asking is the recovery, and it works.
 *
 * ⚠ **What the person declining keeps is a WINDOW, not a record — 4
 * September.** The request line is the only place `@handle` ever appears for a
 * non-mutual, so a mis-tap used to destroy the only copy of it. The portal now
 * holds the struck line with an *Add* beside it until the card closes; nothing
 * is written, nothing is read back, and this function is unchanged. See
 * `DeclinedRequest` in `components/portal.tsx`.
 *
 * ⚠ **The notification is marked read in the same transaction**, because a
 * request whose row is gone but whose notification is unread would sit in the
 * portal as a question with nothing left to answer.
 *
 * Idempotent (§10): declining something nobody asked succeeds and changes
 * nothing. The caller asked for a state, and the state holds.
 */
export async function declineTrack(
  viewer: SessionUser,
  requesterUserId: string,
): Promise<Result<TrackState>> {
  if (requesterUserId === viewer.id) {
    return err('invalid', 'You cannot decline yourself.')
  }

  return db.transaction(async (tx) => {
    await tx
      .delete(tracks)
      .where(
        and(eq(tracks.followerId, requesterUserId), eq(tracks.followedId, viewer.id)),
      )

    await tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, viewer.id),
          eq(notifications.kind, 'track_request'),
          isNull(notifications.readAt),
          sql`${notifications.payload} ->> 'counterpartId' = ${requesterUserId}`,
        ),
      )

    /*
      The viewer's own outbound row is untouched, and that is not an oversight:
      declining answers *their* question and says nothing about whether you
      asked them. In practice the pair cannot be mutual here — a mutual has no
      pending request — but stating it in the read rather than assuming it keeps
      this honest if it is ever called from somewhere new.
    */
    const [out] = await tx
      .select({ followerId: tracks.followerId })
      .from(tracks)
      .where(and(eq(tracks.followerId, viewer.id), eq(tracks.followedId, requesterUserId)))
      .limit(1)

    const outbound = Boolean(out)
    return ok({ outbound, inbound: false, mutual: false })
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
 *
 * ⚠⚠ **IT DELETES BOTH ROWS SINCE 4 SEPTEMBER, AND DELETING ONE STRANDED THE
 * OTHER PERSON.** Removing a mutual used to take only the viewer's row, so
 * theirs survived pointing at somebody who had gone. From their side the People
 * row flipped from *Added each other* to **Requested** — a question nobody had
 * been asked and nobody would answer — and **they could not ask again**, because
 * `trackUser`'s `onConflictDoNothing` makes a second ask over a surviving row a
 * silent no-op that writes no notification. A dead end reached by somebody
 * else's tap.
 *
 * ⚠ **Mutuality is one relationship, so ending it ends the relationship rather
 * than half of it.** Both sides lose the row, both People lists lose the name,
 * and either side can ask afresh — which is the same recovery a decline leaves.
 *
 * ⚠ **This is the SECOND place one person deletes another's row**, after
 * `declineTrack`, and it is held to the same discipline: **every term names the
 * viewer**, so neither clause can reach a row that is not about them. There is
 * no parameter that widens it.
 *
 * ⚠ **A withdrawn request needs nothing done to its notification.** `pending`
 * demands the arrival *and* the row, so deleting the row is what un-asks the
 * question — asserted in `tests/handshake.test.ts`. One transaction (§10)
 * because it is now more than one write.
 */
export async function untrackUser(
  viewer: SessionUser,
  targetUserId: string,
): Promise<Result<TrackState>> {
  await db.transaction(async (tx) => {
    await tx
      .delete(tracks)
      .where(
        and(eq(tracks.followerId, viewer.id), eq(tracks.followedId, targetUserId)),
      )

    await tx
      .delete(tracks)
      .where(
        and(eq(tracks.followerId, targetUserId), eq(tracks.followedId, viewer.id)),
      )
  })

  return ok({ outbound: false, inbound: false, mutual: false })
}
