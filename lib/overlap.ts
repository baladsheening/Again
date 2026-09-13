import 'server-only'

import { sql } from 'drizzle-orm'

import type { Executor } from '@/lib/db/client'
import {
  nameFor,
  SHARED_SCOPES,
  type CaptureSource,
  type CaptureStatus,
  type CaptureVerdict,
  type Intent,
  type NotificationKind,
} from '@/lib/domain'
import { notifications } from '@/lib/db/schema'
import { after } from 'next/server'
import { deliver } from '@/lib/push'
import { listNames } from '@/lib/vocabulary'

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
 * ⚠ **Both also require a non-null intention *on the possibility path*.**
 * `classify` decides on the pair of intents, and a resolved capture that has
 * not been given one cannot be classified. It is excluded in SQL rather than
 * filtered afterwards, so the statement stays one statement.
 *
 * ⚠⚠ **A CAPTURE CONVERGES ON ITS WORDS TOO — Amendment 4, and it is the
 * second subject rather than a second matching module.** Two captures agree
 * when they resolve to the same possibility **or** when their `normalised_text`
 * is identical. Both subjects run through the same `findMutualCounterparts`,
 * the same `classify`, the same `isSuppressed` and the same `writeNotifications`
 * — §6's single-owner rule is about the *rules*, and there is still one copy of
 * every one of them. **Do not add a second matching path for words.**
 *
 * ⚠ **The two subjects are mutually exclusive by construction.** The words path
 * requires `possibility_id is null` on both sides, so a pair that resolved to
 * the same thing *and* typed the same words matches once, on the possibility.
 * Without that term the same pair would be notified twice — and this module
 * deliberately does not deduplicate.
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
  /** Null on the words path, where nothing has been resolved to categorise. */
  intent: Intent | null
  status: CaptureStatus
  verdict: CaptureVerdict | null
  source: CaptureSource
  sourceUserId: string | null
  /** Their own words, which is the title their side of a words match carries. */
  text: string
}

/**
 * **What two captures have in common.** A canonical possibility, or the words.
 *
 * ⚠ **`title` is per-recipient on the words path and shared on the other.** A
 * possibility has one name both people see; a words match has no name but the
 * two people's own lines, which normalise to the same string and may not be
 * spelled the same. Each side is told its own — see `runOverlap`.
 */
export type Subject =
  | { on: 'possibility'; id: string; title: string }
  | { on: 'words'; normalised: string; title: string }

/**
 * One set-based statement (§6, Performance). Joins `tracks` to itself for
 * mutuality, then to `captures`.
 *
 * Never loop over a user's mutual tracks issuing a query each. Retrofitting
 * this is a rewrite rather than an optimisation, which is why it is written
 * this way while the table is empty.
 *
 * Uses `tracks (followed_id, follower_id)` for the reverse leg and either
 * `captures (possibility_id, intent, state)` or `captures_normalised_text_idx`
 * for the lookup — both indexed.
 *
 * ⚠ **One statement, two predicates, and the difference is three lines of
 * SQL.** The possibility path demands a non-null intention because `classify`
 * needs a pair of them; the words path cannot, because an unresolved capture
 * has none — that *is* the case it exists for. ⚠ **The words path also demands
 * `possibility_id is null` on the counterpart**, which is what keeps the two
 * subjects from both firing on one pair.
 */
async function findMutualCounterparts(
  tx: Executor,
  userId: string,
  subject: Subject,
): Promise<Counterpart[]> {
  const match =
    subject.on === 'possibility'
      ? sql`c.possibility_id = ${subject.id} and c.intent is not null`
      : sql`c.normalised_text = ${subject.normalised} and c.possibility_id is null`

  const rows = await tx.execute(sql`
    select
      c.user_id        as "userId",
      p.handle         as "handle",
      p.display_name   as "displayName",
      c.intent         as "intent",
      c.status         as "status",
      c.verdict        as "verdict",
      c.source         as "source",
      c.source_user_id as "sourceUserId",
      c.text           as "text"
    from tracks outbound
    join tracks inbound
      on inbound.follower_id = outbound.followed_id
     and inbound.followed_id = outbound.follower_id
    join captures c
      on c.user_id = outbound.followed_id
     and ${match}
     and c.visibility in (${sharedScopes})
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
  /**
   * ⚠ **Nullable since Amendment 4.** An unresolved capture has no intention —
   * `resolveCapture` is what derives one — so the words path classifies pairs
   * that have none at all. The three intent rules read `=== 'see'` / `=== 'own'`
   * and are false for null without a guard, which is why they did not move.
   */
  intent: Intent | null
  status: CaptureStatus
  verdict: CaptureVerdict | null
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

/*
  ⚠⚠ **THE ALLOWLIST OF THREE PAIRS, ON THE TWO AXES — and it is an allowlist,
  which is the property that must survive this migration.** `classify` returns
  nothing for any pair not named here, so a state that exists and is not
  matched produces **no notification** rather than a wrong one. That is what
  makes `tests/mark.test.ts`'s case true without anybody writing it: a
  crossed-off line converges with nobody, because no row names `dropped`.

  ⚠ **`active` is a status and the other two are verdicts**, which is the
  asymmetry the five states hid: *wanting* is a stage of a life, while *would go
  back* and *have* are opinions about a finished one. Reading the pair off one
  column was only ever possible because the old vocabulary flattened them.
*/
const isWantSee = (s: Side) => s.intent === 'see' && s.status === 'active'
const isGoBackToSee = (s: Side) => s.intent === 'see' && s.verdict === 'again'
const isFixtureOwn = (s: Side) => s.intent === 'own' && s.verdict === 'have'

const isLive = (s: Side) => s.status === 'active'

/**
 * **This pair cannot be read off a pair of intentions.**
 *
 * ⚠ **EITHER side being null is enough, not both — Amendment 4 says so in those
 * words**: *where both sides state an intention the existing three pairs pick
 * the richer sentence, and where either is null it is the plain one.* A capture
 * with an intention and no resolution is rare but reachable, and the failure
 * this amendment exists to fix is a match that silently does not happen — so
 * the fallback has to cover the whole of what the three rules above cannot
 * answer, not the tidy half of it.
 *
 * ⚠ **It cannot fire on the possibility path**, because that query excludes
 * null intents in SQL before `classify` sees a row. That is what stops
 * `want·own × want·own` from becoming a match now that a rule exists which does
 * not name an intention — the exclusion CLAUDE.md §6 argues for as *a plan, not
 * a coincidence*.
 */
const unclassifiable = (u: Side, v: Side) => u.intent === null || v.intent === null

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

  /*
    ⚠⚠ **THE FOURTH ROW — Amendment 4, and it extends the table rather than
    loosening it.** Two people who both wrote the same words and neither of whom
    resolved them to anything: *learn to sail*, *try pottery*, an ambition no
    catalogue will ever hold. It is `convergence`, the same kind the first row
    writes, because the event is the same event — see D1 in the build log: the
    portal already shows the words underneath, so a second sentence would say
    what the screen says.

    ⚠ **The allowlist property survives, which is the thing that had to.** This
    is a fourth named pair, not an `else`: a pair that fails it still returns
    nothing. A crossed-off line converges with nobody, because `isLive` demands
    `active` exactly as `isWantSee` does — `tests/words.test.ts` names that case
    and `tests/mark.test.ts` has relied on it since before there was a rule that
    did not mention an intention.

    ⚠ **Last, and the order is a reading order rather than a precedence.** It
    cannot collide with the three above: each of those needs BOTH sides to state
    an intention, and this needs at least one side not to.
  */
  if (isLive(u) && isLive(v) && unclassifiable(u, v)) {
    return [
      { kind: 'convergence', recipientId: u.userId, counterpartId: v.userId },
      { kind: 'convergence', recipientId: v.userId, counterpartId: u.userId },
    ]
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
type Pending = { match: Match; subject: Subject }

/**
 * The single writer, and **one INSERT however many matches there are**. Both
 * entry points reduce to matches plus a way of naming the people in them, so the
 * row shape is written once — §6's warning about this module drifting applies
 * hardest to the payload, which is what the UI reads.
 *
 * Taking the subject per match rather than for the batch is what lets the pair
 * fan-out below stay one statement: it spans many subjects, and a writer that
 * assumed one would have forced a query per subject — the exact per-row shape
 * §6 rules out for the fan-out itself. **Amendment 4 leans on it a second
 * time**: on the words path the title differs between the two recipients.
 *
 * ⚠⚠ **`itemId` IS UNCHANGED AND A WORDS MATCH SIMPLY HAS NONE.** Every
 * notification written before Amendment 4 keeps working, and the three reads
 * that join on it keep finding those rows — the words rows carry
 * `normalisedText` instead and are found by a second term. **Do not "tidy"
 * these into one `matchKey` field**: that rewrites history, and the reads would
 * then have to migrate every payload ever written to keep the mark on a line
 * from March.
 */
async function writeNotifications(
  tx: Executor,
  pending: Pending[],
  names: ReadonlyMap<string, Named>,
): Promise<Match[]> {
  if (pending.length === 0) return []

  const rows = pending.map(({ match, subject }) => ({
    userId: match.recipientId,
    kind: match.kind satisfies NotificationKind,
    payload: {
      ...(subject.on === 'possibility'
        ? { itemId: subject.id }
        : { normalisedText: subject.normalised }),
      title: subject.title,
      counterpartId: match.counterpartId,
      counterpartName: notificationName(names.get(match.counterpartId)),
      ...(match.guideHolder ? { guideHolder: true } : {}),
    },
  }))

  await tx.insert(notifications).values(rows)

  /*
    ⚠⚠ **DELIVERY IS SCHEDULED HERE, IN THE ONE PLACE THAT ALREADY KNOWS WHAT
    WAS WRITTEN — earned push, Amendment 10.** Every path that produces a
    notification goes through this function, so hanging the send off it means no
    caller has to remember to, and a fifth trigger added later gets delivery for
    free. The alternative was plumbing the rows back out through `runOverlap`,
    `fireOverlap` and every action above them — five signatures changed so that
    one of them could call a function this one could already call.

    ⚠ **`after`, not `await`.** The send is a third-party HTTP call and this is
    inside the capture's transaction; §6 says push delivery never happens
    inline, and `lib/push.ts` carries the full argument for why `after` is the
    honest reading of that. **The row is committed either way** — what is
    scheduled is a copy of it, not the record.

    ⚠⚠ **THE `try` IS FOR THE TESTS, AND IT IS NOT A SWALLOWED ERROR.** `after`
    throws when there is no request to be after — which is exactly the case in
    `tests/`, where the fan-out is driven straight against the database. **Not
    scheduling a push in a test is correct**, and a bare call would have turned
    every convergence test red for a reason that has nothing to do with
    convergence. ⚠ **The catch is deliberately empty and must stay narrow**: the
    only thing it may absorb is *there is no request here*.
  */
  try {
    after(() =>
      deliver(
        rows.map((r) => ({
          userId: r.userId,
          title: notificationCopy(r.kind, {
            counterpartName: r.payload.counterpartName,
            title: r.payload.title,
            guideHolder: r.payload.guideHolder === true,
            onWords: 'normalisedText' in r.payload,
          }),
          /*
            ⚠ **One line, and the standalone register is the whole of it.** The
            portal's *Sam too.* reads correctly under a capture the screen is
            already showing; a notification has no screen, so it gets
            `notificationCopy` — which is what that register was written for and
            why it has sat unused since Phase 2.
          */
          tag: r.kind,
        })),
      ),
    )
  } catch {
    /* No request to be after — a test, or a script. Nothing to deliver into. */
  }

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
  subject: Subject,
): Promise<Match[]> {
  const counterparts = await findMutualCounterparts(tx, actor.userId, subject)

  const names = new Map<string, Named>([[actor.userId, actor]])
  for (const c of counterparts) names.set(c.userId, c)

  return writeNotifications(
    tx,
    counterparts.flatMap((v) =>
      classify(actor, v).map((match) => ({
        match,
        /*
          ⚠ **Each person is told their own words.** `subject.title` is the
          actor's line; the counterpart's notification carries theirs. The two
          normalise to the same string and may differ in case and punctuation,
          and a standalone line that quoted somebody else's spelling of your own
          capture back at you reads as the app quoting them — see D2.

          On the possibility path there is one title and both sides get it, so
          this is a no-op there.
        */
        subject:
          subject.on === 'words' && match.recipientId === v.userId
            ? { ...subject, title: v.text }
            : subject,
      })),
    ),
    names,
  )
}

/* -------------------------------------------------------------------------- */
/*  The second trigger: a track becoming mutual                                */
/* -------------------------------------------------------------------------- */

type PairRow = {
  /** Null on a words row, where there is no canonical thing. */
  itemId: string | null
  /** Null on a possibility row. */
  normalisedText: string | null
  /** The possibility's name, or each side's own words. */
  aTitle: string
  bTitle: string
  aIntent: Intent | null
  aStatus: CaptureStatus
  aVerdict: CaptureVerdict | null
  aSource: CaptureSource
  aSourceUserId: string | null
  bIntent: Intent | null
  bStatus: CaptureStatus
  bVerdict: CaptureVerdict | null
  bSource: CaptureSource
  bSourceUserId: string | null
}

/** A pair row's subject, from whichever half of the union produced it. */
function pairSubject(row: PairRow, title: string): Subject {
  return row.itemId
    ? { on: 'possibility', id: row.itemId, title }
    : { on: 'words', normalised: row.normalisedText ?? '', title }
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
  /*
    ⚠⚠ **A UNION, AND STILL ONE STATEMENT.** §6's rule is that the fan-out is
    set-based — never a query per row — and a `union all` of two set-based legs
    is one round trip and one plan. **Do not split this into two `tx.execute`
    calls**: the second would be a second statement inside the same transaction
    doing the same job, which is the shape that drifts.

    ⚠ **The legs cannot overlap**, because the words leg requires
    `possibility_id is null` on both sides and the possibility leg requires it
    non-null on both. A pair that resolved to one thing *and* wrote one string
    is announced once.
  */
  const result = await tx.execute(sql`
    select
      i.id              as "itemId",
      null              as "normalisedText",
      i.title           as "aTitle",
      i.title           as "bTitle",
      ca.intent         as "aIntent",
      ca.status         as "aStatus",
      ca.verdict        as "aVerdict",
      ca.source         as "aSource",
      ca.source_user_id as "aSourceUserId",
      cb.intent         as "bIntent",
      cb.status         as "bStatus",
      cb.verdict        as "bVerdict",
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

    union all

    select
      null              as "itemId",
      ca.normalised_text as "normalisedText",
      ca.text           as "aTitle",
      cb.text           as "bTitle",
      ca.intent         as "aIntent",
      ca.status         as "aStatus",
      ca.verdict        as "aVerdict",
      ca.source         as "aSource",
      ca.source_user_id as "aSourceUserId",
      cb.intent         as "bIntent",
      cb.status         as "bStatus",
      cb.verdict        as "bVerdict",
      cb.source         as "bSource",
      cb.source_user_id as "bSourceUserId"
    from captures ca
    join captures cb
      on cb.normalised_text = ca.normalised_text
     and cb.possibility_id is null
     and cb.user_id = ${b.userId}
     and cb.visibility in (${sharedScopes})
    where ca.user_id = ${a.userId}
      and ca.possibility_id is null
      and ca.visibility in (${sharedScopes})
      and ca.normalised_text <> ''
  `)

  const names = new Map<string, Named>([
    [a.userId, a],
    [b.userId, b],
  ])

  const pending = (result.rows as unknown as PairRow[]).flatMap((row) =>
    classify(
      {
        userId: a.userId,
        intent: row.aIntent,
        status: row.aStatus,
        verdict: row.aVerdict,
        source: row.aSource,
        sourceUserId: row.aSourceUserId,
      },
      {
        userId: b.userId,
        intent: row.bIntent,
        status: row.bStatus,
        verdict: row.bVerdict,
        source: row.bSource,
        sourceUserId: row.bSourceUserId,
      },
      /* Each side is told its own words — see `runOverlap`. */
    ).map((match) => ({
      match,
      subject: pairSubject(row, match.recipientId === a.userId ? row.aTitle : row.bTitle),
    })),
  )

  return writeNotifications(tx, pending, names)
}

/* -------------------------------------------------------------------------- */
/*  Copy (§6)                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The portal's register — 30 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The same events, said in two words instead of a sentence.**
 * `notificationCopy` below writes a standalone line — it has to name the thing,
 * because nothing else on the screen does. **A portal row already shows the
 * capture**, so the title is on the row and what is left to say is who, and in
 * what tense.
 *
 * ⚠ **Both registers live here, and that is the point.** §6 says this module is
 * the single owner of everything about a match and warns that the payload is
 * what drifts hardest, *because it is what the UI reads*. Two ways of saying one
 * event kept in two files is the drift; kept adjacent, a kind added to
 * `NotificationKind` fails to compile in both at once.
 *
 * ⚠ **The tense IS the product** — §5 of `phase-2-convergence.md`. Four
 * sentences, no vocabulary to learn:
 *
 * | their state | says |
 * |---|---|
 * | both still want it | **Sam too.** |
 * | they have done it | **Sam has.** |
 * | you have done it, they want to | **Sam wants to.** |
 * | both done | **Sam has too.** |
 *
 * ⚠⚠ **The fourth row cannot fire, and that is `classify`'s doing rather than an
 * omission here.** `go_back_to × go_back_to` produces no match at all — *both
 * know* — so there is no notification to carry *Sam has too.* **Do not add the
 * sentence to make the table complete**: the sentence would be true and the
 * event would still not exist. If it is ever wanted, it is a row in `classify`
 * and a new `NotificationKind`, decided there.
 *
 * ⚠ **`lend` has no row in that table and gets one written here**, flagged the
 * same way `notificationCopy`'s unspecified lines are. It is the strongest
 * notification in the app and the portal cannot be the one surface that stays
 * silent about it.
 *
 * ⚠ **Everyone is named** — §5, and it follows from §10's scale note: the
 * mechanic assumes small clusters, so *Sam and Ali too.* is right and *Sam and 4
 * others* is a metric. **There is no cut-off and there must not be one**; the
 * day a line has eleven names on it, the honest fix is that the app has grown a
 * shape this design did not predict, not that the eleventh person is noise.
 */
export function portalSentence(
  kind: NotificationKind,
  names: readonly string[],
  guideHolder = false,
): string {
  const who = listNames(names)
  const many = names.length > 1

  switch (kind) {
    case 'convergence':
      return `${who} too.`
    case 'guide':
      /*
        The two sides of one event, and they say opposite things. The guide is
        the one who would go back to it, so the other person is the one who
        wants to; a reader on the other side of the same row has already done
        the thing and is being told who has not.
      */
      return guideHolder ? `${who} ${many ? 'want' : 'wants'} to.` : `${who} ${many ? 'have' : 'has'}.`
    /* Not in §5's table — see the note above. */
    case 'lend':
      return `${who} ${many ? 'have' : 'has'} one.`
    /*
      ⚠ **The seventh kind, and the only one here that is not about a
      possibility** — see `docs/re-direction/the-handshake.md`. It is written
      beside the others for the reason this whole block exists: a kind added to
      `NotificationKind` must fail to compile in both registers at once, and the
      day a request says one thing in the portal and another in a push is the
      day §6's warning about the payload comes true.

      ⚠ **The screen says ADD and the code says TRACK — directed, 4 September.**
      §4 makes the vocabulary load-bearing in identifiers *and* in copy, and this
      is the first place the two are deliberately split: the relation is a
      track, the act of asking for one is called adding. `track_request` keeps
      its name; this sentence does not use it.

      ⚠ **Named `@handle`, never a display name.** §5: a name is for people who
      know you, and somebody who has only asked does not yet. `nameFor` with
      `mutual: false` is what puts the `@` there, at the moment the row was
      written — see `listMyPortal` on why the payload is the record.

      ⚠ **It said *`@sam` added you.* for an hour — directed to this, 4
      September, after use.** *Added* was the past tense of a thing that has not
      finished happening; **what a request is is a want**, and the sentence now
      says so and hands straight to its two answers. It is also the only line in
      this file that is a whole row rather than a clause under one — see
      `Portal`, where the sentence and *Accept* / *Decline* sit on one line.

      ⚠ **This is the one place *track* is spoken on screen**, against the *the
      screen says ADD* rule set the same morning. Directed, and it reads right:
      the button is a verb you press, and this is a person describing what they
      want. If the two ever have to agree, the button moves — the relation has
      always been a track.
    */
    case 'track_request':
      return `${who} ${many ? 'want' : 'wants'} to track you.`
    /*
      ⚠ **Three kinds cannot reach a portal row and say so rather than falling
      through.** The portal is built by joining a notification to *the viewer's
      own capture for the same possibility*, and these three are not about a
      possibility at all: two are about a swap and `landed` predates the capture
      model. They are unreachable by the join rather than filtered out, and this
      arm exists so that adding a kind which IS about a possibility fails here
      loudly instead of rendering an empty sentence.
    */
    case 'swap_invite':
    case 'swap_revealed':
    case 'landed':
      return `${who}.`
  }
}

/*
  ⚠⚠ **`listNames` LIVES IN `lib/vocabulary.ts` SINCE 13 SEPTEMBER AND MUST NOT
  COME BACK HERE.** It was private to this file until the control inside the
  sentence started naming the same people — *Message Omari and Ali* — and a
  client component cannot import a `server-only` module. **Two copies of the
  joining rule would disagree the first time three people converged on one
  line**, in one place only, with nothing to say so. See the docblock there.
*/

/**
 * The two lines given verbatim in the brief are `convergence` and the
 * guide-side of `guide`. The counterpart lines marked below were not specified
 * — written to the simplest thing that reads right, and flagged.
 */
export function notificationCopy(
  kind: NotificationKind,
  p: { counterpartName: string; title: string; guideHolder?: boolean; onWords?: boolean },
): string {
  switch (kind) {
    /*
      ⚠⚠ **TWO SENTENCES FOR ONE KIND, AND THIS IS THE ONE PLACE THE WORDS PATH
      NEEDS ITS OWN — Amendment 4.** *both want to see* is a film's verb welded
      into a sentence, and *You and Sam both want to see learn to sail* is not
      English. `onWords` is the same shape `guideHolder` already is: a
      discriminator inside a kind, not an eighth `NotificationKind`.

      ⚠ **`portalSentence` does NOT branch and must not learn to.** It says
      *Sam too.* either way, because a portal row already shows the capture
      underneath — the words are on the screen, so the sentence does not repeat
      them. This register is the standalone one, which has to name the thing
      because nothing else does. That asymmetry is the whole reason both
      registers live in this file.

      ⚠ **Quoted, where the other lines are not.** A title is a name and reads
      as one bare; arbitrary words do not — *You and Sam both saved learn to
      sail* loses where the capture starts.
    */
    case 'convergence':
      return p.onWords
        ? `You and ${p.counterpartName} both saved “${p.title}”.`
        : `You and ${p.counterpartName} both want to see ${p.title}.`
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
    /*
      ⚠ **The one kind with no `title`, because it is about a person.** Both
      registers say the same words for it — there is no capture for a standalone
      line to name that a portal row would already be showing, so the two
      cannot differ. See `portalSentence` above for the vocabulary split.
    */
    case 'track_request':
      return `${p.counterpartName} wants to track you.`
  }
}
