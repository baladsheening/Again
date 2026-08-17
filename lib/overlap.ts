import 'server-only'

import { sql } from 'drizzle-orm'

import type { Executor } from '@/lib/db/client'
import { nameFor, type EntryState, type Intent, type NotificationKind } from '@/lib/domain'
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

/** Enough of a profile to name someone in a notification. */
export type Named = { handle: string; displayName: string | null }

/**
 * A notification only ever crosses a **mutual** track — that is the precondition
 * of both fan-outs below, not an assumption made here — and a mutual track is
 * exactly the condition §5 attaches names to. So `nameFor` is asked with
 * `mutual: true` rather than being handed a third naming rule of its own.
 */
function notificationName(person: Named | undefined): string {
  return person ? nameFor({ ...person, mutual: true }) : 'Someone'
}

/** A match and the thing it is about. One notification row. */
type Pending = { match: Match; item: { id: string; title: string } }

/**
 * The single writer, and **one INSERT however many matches there are**. Both
 * entry points reduce to matches plus a way of naming the people in them, so the
 * row shape is written once — §6's warning about this module drifting applies
 * hardest to the payload, which is what the UI reads.
 *
 * Taking the item per match rather than for the batch is what lets the pair
 * fan-out below stay one statement: it spans many items, and a writer that
 * assumed one would have forced a query per item — the exact per-row shape §6
 * rules out for the fan-out itself.
 */
async function writeNotifications(
  tx: Executor,
  pending: Pending[],
  names: ReadonlyMap<string, Named>,
): Promise<Match[]> {
  if (pending.length === 0) return []

  await tx.insert(notifications).values(
    pending.map(({ match, item }) => ({
      userId: match.recipientId,
      kind: match.kind satisfies NotificationKind,
      payload: {
        itemId: item.id,
        title: item.title,
        counterpartId: match.counterpartId,
        counterpartName: notificationName(names.get(match.counterpartId)),
        ...(match.guideHolder ? { guideHolder: true } : {}),
      },
    })),
  )

  return pending.map((p) => p.match)
}

/**
 * Run on insert into `entries`, and on any state change.
 *
 * Writes notification rows and returns — push delivery is a background worker's
 * job, never inline (§6). Takes the ambient transaction so the entry write and
 * its notifications never partially apply (§10).
 */
export async function runOverlap(
  tx: Executor,
  actor: Side & Named,
  item: { id: string; title: string },
): Promise<Match[]> {
  const counterparts = await findMutualCounterparts(tx, actor.userId, item.id)

  const names = new Map<string, Named>([[actor.userId, actor]])
  for (const c of counterparts) names.set(c.userId, c)

  return writeNotifications(
    tx,
    counterparts.flatMap((v) => classify(actor, v).map((match) => ({ match, item }))),
    names,
  )
}

/* -------------------------------------------------------------------------- */
/*  The second trigger: a track becoming mutual                                */
/* -------------------------------------------------------------------------- */

type PairRow = {
  itemId: string
  title: string
  aIntent: Intent
  aState: EntryState
  aSource: string
  aSourceUserId: string | null
  bIntent: Intent
  bState: EntryState
  bSource: string
  bSourceUserId: string | null
}

/**
 * §6 runs the fan-out on insert into `entries` and on state change, which misses
 * the case where two people **already** hold matching wants and only then start
 * tracking each other. No entry moves, so nothing fires.
 *
 * That is the seed-time case §13 describes — a dozen friends joining in a week
 * and backfilling their lists before the graph is complete — so it is the app's
 * first impression, and it was the one case the trigger did not cover.
 *
 * Same module, same `classify`, same writer: a second **caller**, not a second
 * copy of the rules. Scoped to the one pair, and still one set-based statement —
 * `entries` joined to itself on `item_id`, which is what
 * `entries_item_intent_state_idx` and the `(user_id, item_id, intent)` unique
 * index are both able to drive.
 *
 * ⚠ **Deliberately uncapped, and that is a decision with a date on it.** Two
 * people with forty items in common produce forty matches per side at the moment
 * they connect. While notifications are in-app that is the *value* of connecting
 * arriving all at once rather than a flood — the app has nowhere else to say it.
 * It stops being obviously right the moment push exists; `docs/plan.md` carries
 * it into Phase 5, where the worker is written.
 */
export async function runOverlapForNewMutual(
  tx: Executor,
  a: { userId: string } & Named,
  b: { userId: string } & Named,
): Promise<Match[]> {
  const result = await tx.execute(sql`
    select
      i.id              as "itemId",
      i.title           as "title",
      ea.intent         as "aIntent",
      ea.state          as "aState",
      ea.source         as "aSource",
      ea.source_user_id as "aSourceUserId",
      eb.intent         as "bIntent",
      eb.state          as "bState",
      eb.source         as "bSource",
      eb.source_user_id as "bSourceUserId"
    from entries ea
    join entries eb
      on eb.item_id = ea.item_id
     and eb.user_id = ${b.userId}
    join items i
      on i.id = ea.item_id
    where ea.user_id = ${a.userId}
  `)

  const names = new Map<string, Named>([
    [a.userId, a],
    [b.userId, b],
  ])

  const pending = (result.rows as unknown as PairRow[]).flatMap((row) => {
    const item = { id: row.itemId, title: row.title }
    return classify(
      {
        userId: a.userId,
        intent: row.aIntent,
        state: row.aState,
        source: row.aSource,
        sourceUserId: row.aSourceUserId,
      },
      {
        userId: b.userId,
        intent: row.bIntent,
        state: row.bState,
        source: row.bSource,
        sourceUserId: row.bSourceUserId,
      },
    ).map((match) => ({ match, item }))
  })

  return writeNotifications(tx, pending, names)
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
