import 'server-only'

import { sql } from 'drizzle-orm'

import type { Executor } from '@/lib/db/client'
import type { EntryState, Intent, NotificationKind } from '@/lib/domain'
import { notifications } from '@/lib/db/schema'

/**
 * §6. All of it, in one module, called from the entry mutation. It is the thing
 * most likely to drift if it gets scattered — so nothing here is duplicated
 * anywhere else in the codebase.
 */

/* -------------------------------------------------------------------------- */
/*  The fan-out query                                                          */
/* -------------------------------------------------------------------------- */

type Counterpart = {
  userId: string
  handle: string
  displayName: string | null
  intent: Intent
  state: EntryState
  source: string
  sourceUserId: string | null
}

/**
 * One set-based statement (§6, Performance). Joins `tracks` to itself for
 * mutuality, then to `entries`.
 *
 * Never loop over a user's mutual tracks issuing a query each. Retrofitting
 * this is a rewrite rather than an optimisation, which is why it is written
 * this way while the table is empty.
 *
 * Uses `tracks (followed_id, follower_id)` for the reverse leg and
 * `entries (item_id, intent, state)` for the entry lookup — both indexed.
 */
async function findMutualCounterparts(
  tx: Executor,
  userId: string,
  itemId: string,
): Promise<Counterpart[]> {
  const rows = await tx.execute(sql`
    select
      e.user_id        as "userId",
      p.handle         as "handle",
      p.display_name   as "displayName",
      e.intent         as "intent",
      e.state          as "state",
      e.source         as "source",
      e.source_user_id as "sourceUserId"
    from tracks outbound
    join tracks inbound
      on inbound.follower_id = outbound.followed_id
     and inbound.followed_id = outbound.follower_id
    join entries e
      on e.user_id = outbound.followed_id
     and e.item_id = ${itemId}
    join profiles p
      on p.id = e.user_id
    where outbound.follower_id = ${userId}
  `)

  return rows.rows as unknown as Counterpart[]
}

/* -------------------------------------------------------------------------- */
/*  Suppression                                                                */
/* -------------------------------------------------------------------------- */

type Side = {
  userId: string
  intent: Intent
  state: EntryState
  source: string
  sourceUserId: string | null
}

/**
 * The most important line in the app (§6).
 *
 * Without it, copying something off someone's page immediately pings them that
 * you match — which is noise, because they are the source. Only independent
 * convergence is worth interrupting anyone for. Swaps are bulk copying and
 * would otherwise fire a burst of false alerts.
 */
function isSuppressed(u: Side, v: Side): boolean {
  const copied = (side: Side, other: Side) =>
    (side.source === 'copy' || side.source === 'swap') && side.sourceUserId === other.userId

  return copied(u, v) || copied(v, u)
}

/* -------------------------------------------------------------------------- */
/*  The match table                                                            */
/* -------------------------------------------------------------------------- */

export type Match = {
  kind: Extract<NotificationKind, 'convergence' | 'guide' | 'lend'>
  /** Whose notification this is. */
  recipientId: string
  /** The other party, named in the copy. */
  counterpartId: string
  /**
   * Which side of a `guide` event this is. Was `returnCount`, which doubled as
   * the discriminator and as the number in the copy — both went when the count
   * did (8 August). The two sides still need telling apart: one person wants the
   * thing, the other is the one who would go back to it.
   */
  guideHolder?: boolean
}

const isWantSee = (s: Side) => s.intent === 'see' && s.state === 'want'
const isGoBackToSee = (s: Side) => s.intent === 'see' && s.state === 'go_back_to'
const isFixtureOwn = (s: Side) => s.intent === 'own' && s.state === 'fixture'

/**
 * Intent must be part of the match (§6). Two people wanting to *see* a film is
 * a plan. One wanting to see it and one wanting to own a disc is not a match at
 * all — so `want·own × want·own` produces nothing but affinity, shown on the
 * profile, and `go_back_to × go_back_to` produces nothing because both know.
 *
 * Evaluated in both directions: the table in §6 is written U/V, but the only
 * asymmetric row (`want·see × fixture·own`) has to fire whichever side moved.
 * Someone adding a fixture must trigger `lend` against an existing want, not
 * only the reverse.
 */
export function classify(u: Side, v: Side): Match[] {
  if (isSuppressed(u, v)) return []

  // want·see × want·see -> convergence, notify both.
  if (isWantSee(u) && isWantSee(v)) {
    return [
      { kind: 'convergence', recipientId: u.userId, counterpartId: v.userId },
      { kind: 'convergence', recipientId: v.userId, counterpartId: u.userId },
    ]
  }

  // want·see × go_back_to·see -> guide, notify both.
  for (const [wanter, guide] of [
    [u, v],
    [v, u],
  ] as const) {
    if (isWantSee(wanter) && isGoBackToSee(guide)) {
      return [
        {
          kind: 'guide',
          recipientId: guide.userId,
          counterpartId: wanter.userId,
          guideHolder: true,
        },
        // The wanter's side of the same event: they are not the guide.
        { kind: 'guide', recipientId: wanter.userId, counterpartId: guide.userId },
      ]
    }
  }

  // want·see × fixture·own -> lend, notify both. The strongest notification in
  // the app, and it falls out of intents being separate.
  for (const [wanter, owner] of [
    [u, v],
    [v, u],
  ] as const) {
    if (isWantSee(wanter) && isFixtureOwn(owner)) {
      return [
        { kind: 'lend', recipientId: wanter.userId, counterpartId: owner.userId },
        { kind: 'lend', recipientId: owner.userId, counterpartId: wanter.userId },
      ]
    }
  }

  return []
}

/* -------------------------------------------------------------------------- */
/*  Entry point                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Run on insert into `entries`, and on any state change.
 *
 * Writes notification rows and returns — push delivery is a background worker's
 * job, never inline (§6). Takes the ambient transaction so the entry write and
 * its notifications never partially apply (§10).
 */
export async function runOverlap(
  tx: Executor,
  actor: Side & { handle: string },
  item: { id: string; title: string },
): Promise<Match[]> {
  const counterparts = await findMutualCounterparts(tx, actor.userId, item.id)

  const matches = counterparts.flatMap((v) => classify(actor, v))
  if (matches.length === 0) return []

  const byId = new Map(counterparts.map((c) => [c.userId, c]))

  await tx.insert(notifications).values(
    matches.map((m) => ({
      userId: m.recipientId,
      kind: m.kind satisfies NotificationKind,
      payload: {
        itemId: item.id,
        title: item.title,
        counterpartId: m.counterpartId,
        counterpartName:
          m.counterpartId === actor.userId
            ? actor.handle
            : (byId.get(m.counterpartId)?.displayName ??
              byId.get(m.counterpartId)?.handle ??
              'Someone'),
        ...(m.guideHolder ? { guideHolder: true } : {}),
      },
    })),
  )

  return matches
}

/* -------------------------------------------------------------------------- */
/*  Copy (§6)                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The two lines given verbatim in the brief are `convergence` and the
 * guide-side of `guide`. The counterpart lines marked below were not specified
 * — written to the simplest thing that reads right, and flagged.
 */
export function notificationCopy(
  kind: NotificationKind,
  p: { counterpartName: string; title: string; guideHolder?: boolean },
): string {
  switch (kind) {
    case 'convergence':
      return `You and ${p.counterpartName} both want to see ${p.title}.`
    /*
      §6 gives the guide-holder's line as "…You've been back n times." The count
      was removed on 8 August, so the sentence cannot be written — and it would
      have read "back 0 times", since the column survives at its default and
      nothing increments it any more.

      What replaces it keeps the point of the notification: you are the person
      who would go back to this, and someone you track has just said they want
      it. The evidence is weaker without a number. **This is the clearest cost of
      removing the count and wants a read-through before Phase 3 ships** — see
      docs/plan.md.
    */
    case 'guide':
      return p.guideHolder
        ? `${p.counterpartName} wants to see ${p.title}. You would go back to it.`
        : // Not specified in the brief — the wanter's side of the same event.
          `${p.counterpartName} would go back to ${p.title}.`
    case 'lend':
      return `${p.counterpartName} has a copy of ${p.title}.`
    case 'swap_invite':
      return `${p.counterpartName} started a swap with you.`
    case 'swap_revealed':
      return `You and ${p.counterpartName} swapped.`
    case 'landed':
      return `${p.counterpartName} would go back to ${p.title}.`
  }
}
