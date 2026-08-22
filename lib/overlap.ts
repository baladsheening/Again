import 'server-only'

import { sql } from 'drizzle-orm'

import type { Executor } from '@/lib/db/client'
import {
  nameFor,
  SHARED_SCOPES,
  type CaptureSource,
  type CaptureState,
  type Intent,
  type NotificationKind,
} from '@/lib/domain'
import { notifications } from '@/lib/db/schema'

/**
 * §6. All of it, in one module, called from the capture mutations. It is the
 * thing most likely to drift if it gets scattered — so nothing here is
 * duplicated anywhere else in the codebase.
 *
 * ⚠ **Both fan-outs carry the visibility term, and it is not optional.**
 * Convergence is two people independently holding an intention *they have each
 * shared*. A private capture is not a signal to anybody, so a fan-out that
 * ignored the scope would notify someone about a list its owner never opened —
 * which is the failure this whole model exists to prevent.
 *
 * ⚠ **Both also require a non-null intention.** `classify` decides on the pair
 * of intents, and a capture that has not been given one cannot be classified.
 * It is excluded in SQL rather than filtered afterwards, so the statement stays
 * one statement.
 */

/* -------------------------------------------------------------------------- */
/*  The fan-out query                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The shared scopes as a parameterised list.
 *
 * ⚠ **Not `= any(${array})`.** Drizzle sends a JS array as one parameter and
 * Postgres reads it as an array *literal*, which `'mutuals'` is not — the
 * statement fails at runtime with a parse error and nothing in a type check
 * sees it coming. `sql.join` expands to one placeholder per value, which is
 * what an `in` list wants.
 */
const sharedScopes = sql.join(
  SHARED_SCOPES.map((scope) => sql`${scope}`),
  sql`, `,
)

type Counterpart = {
  userId: string
  handle: string
  displayName: string | null
  intent: Intent
  state: CaptureState
  source: CaptureSource
  sourceUserId: string | null
}

/**
 * One set-based statement (§6, Performance). Joins `tracks` to itself for
 * mutuality, then to `captures`.
 *
 * Never loop over a user's mutual tracks issuing a query each. Retrofitting
 * this is a rewrite rather than an optimisation, which is why it is written
 * this way while the table is empty.
 *
 * Uses `tracks (followed_id, follower_id)` for the reverse leg and
 * `captures (possibility_id, intent, state)` for the lookup — both indexed.
 */
async function findMutualCounterparts(
  tx: Executor,
  userId: string,
  possibilityId: string,
): Promise<Counterpart[]> {
  const rows = await tx.execute(sql`
    select
      c.user_id        as "userId",
      p.handle         as "handle",
      p.display_name   as "displayName",
      c.intent         as "intent",
      c.state          as "state",
      c.source         as "source",
      c.source_user_id as "sourceUserId"
    from tracks outbound
    join tracks inbound
      on inbound.follower_id = outbound.followed_id
     and inbound.followed_id = outbound.follower_id
    join captures c
      on c.user_id = outbound.followed_id
     and c.possibility_id = ${possibilityId}
     and c.visibility in (${sharedScopes})
     and c.intent is not null
    join profiles p
      on p.id = c.user_id
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
  state: CaptureState
  source: CaptureSource
  sourceUserId: string | null
}

/**
 * The most important line in the app (§6).
 *
 * Without it, copying something off someone's page immediately pings them that
 * you match — which is noise, because they are the source. Only independent
 * convergence is worth interrupting anyone for.
 *
 * A **transfer** is the same argument at volume: §9's in-person exchange hands
 * over a selected set of captures at once, so a transfer that did not suppress
 * would fire a burst of alerts at the person who had just handed the list
 * over, one per row, in the minute after they did it.
 */
function isSuppressed(u: Side, v: Side): boolean {
  /*
    ⚠ **Not a list of the sources that suppress — the one source that does
    not.** This was `source === 'copy' || source === 'swap'`, naming the values
    by hand, and it went wrong exactly the way a hand-written list goes wrong:
    `swap` was designed and never built, `transfer` took its slot in the
    capture model, and the test that would have caught it did not exist because
    nothing about the code looked incomplete. A transferred capture was an
    independent intention as far as this function could tell, and the person it
    would have notified is the person who handed it over.

    Written this way, a source added later suppresses until somebody decides it
    should not. That is the direction this has to fail in: the cost of
    suppressing too much is a notification nobody gets, and the cost of
    suppressing too little is telling someone they match a list they gave you.

    `CaptureSource` is a union rather than a string, so adding a value that
    genuinely should notify means changing this line on purpose.
  */
  const sourced = (side: Side, other: Side) =>
    side.source !== 'self' && side.sourceUserId === other.userId

  return sourced(u, v) || sourced(v, u)
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
 * Run when a capture is created, when its state changes, and when it becomes
 * shared — the three moments a capture can start being a signal to somebody.
 * The caller decides *whether* to run it; this decides who it reaches.
 *
 * Writes notification rows and returns — push delivery is a background worker's
 * job, never inline (§6). Takes the ambient transaction so the entry write and
 * its notifications never partially apply (§10).
 */
export async function runOverlap(
  tx: Executor,
  actor: Side & Named,
  possibility: { id: string; title: string },
): Promise<Match[]> {
  const counterparts = await findMutualCounterparts(tx, actor.userId, possibility.id)

  const names = new Map<string, Named>([[actor.userId, actor]])
  for (const c of counterparts) names.set(c.userId, c)

  return writeNotifications(
    tx,
    counterparts.flatMap((v) => classify(actor, v).map((match) => ({ match, item: possibility }))),
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
  aState: CaptureState
  aSource: CaptureSource
  aSourceUserId: string | null
  bIntent: Intent
  bState: CaptureState
  bSource: CaptureSource
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
 * `captures` joined to itself on `possibility_id`, which is what
 * `captures_possibility_intent_state_idx` and the
 * `(user_id, possibility_id, intent)` unique index are both able to drive.
 *
 * ⚠ **A capture with no possibility joins to nothing here, and that is correct
 * for now.** Two people who both typed the same unmatched words are the Phase 2
 * possible-match path, which reads `normalised_text` and is not this function.
 * Exact convergence means the same canonical thing.
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
      ca.intent         as "aIntent",
      ca.state          as "aState",
      ca.source         as "aSource",
      ca.source_user_id as "aSourceUserId",
      cb.intent         as "bIntent",
      cb.state          as "bState",
      cb.source         as "bSource",
      cb.source_user_id as "bSourceUserId"
    from captures ca
    join captures cb
      on cb.possibility_id = ca.possibility_id
     and cb.user_id = ${b.userId}
     and cb.visibility in (${sharedScopes})
     and cb.intent is not null
    join items i
      on i.id = ca.possibility_id
    where ca.user_id = ${a.userId}
      and ca.visibility in (${sharedScopes})
      and ca.intent is not null
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
