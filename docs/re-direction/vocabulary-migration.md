# The vocabulary migration

**Started 3 September. Stage 1 step A is built and applied to development.**

This is the last thing holding Phase 1 open. It is a runbook, not a design
document: **strike each step as it lands, and move this file to
`docs/re-direction/inactive/` when both stages are done.** A runbook that
outlives its execution reads as current and is not.

---

## What it is for

Not a rename. **It is the change that lets a capture be something other than a
film.**

The stored vocabulary was written for a film diary. `go_back_to` states a
rewatch criterion; `fixture` means a film you own; the intents are
`see`/`own`/`try`/`read`. They describe a relationship to *media you consume*
and nothing else fits inside them — you cannot capture *learn Portuguese* today
and have the record mean anything, because the nearest word is `see`.

Three things follow:

- **The tray stops lying.** `fixture` renders as *Have* and nothing in the
  product can reach it: a capture acquires its kind by resolving to a
  possibility, and TMDB is the only catalogue. An unreachable word is the
  symptom of a vocabulary describing a product that is not there yet.
- **It unblocks Phase 4.** A user-contributed catalogue writes possibilities
  that are places, products and events. No intention in the current four fits a
  place.
- **It is Phase 1's last open criterion**, and §13 requires each phase deployed
  and verified before the next begins.

⚠ **Stated honestly: nothing on screen is broken today.** `STATE_WORD` and
`WHERE_IT_IS` already translate the stored values, so no user-visible label uses
film-first words. This is a migration for what it *permits*, not a repair. That
is why it is worth doing while the record is small rather than when it is not.

---

## ⚠⚠ THERE IS NO POSTGRES ENUM, AND THREE DOCUMENTS SAID THERE WAS

**This is the finding that made the work smaller, and it is why the migration
had been deferred since 24 August.**

Every vocabulary column is a plain `text` column with a TypeScript-only type:

```
drizzle/0000: "state" text NOT NULL          -- entries
drizzle/0004: "state" text NOT NULL          -- captures
lib/db/schema.ts:  state: text('state').$type<CaptureState>()
```

`$type<>` is compile-time only; Postgres sees `text`. There is no `pgEnum`
anywhere in the tree, no CHECK constraint on any of these values, and no partial
index with a value in its predicate. The only constraints touching `intent` are
a unique key and two indexes, all value-agnostic.

**So a value change is an `UPDATE`, and the down migration is the inverse
`UPDATE`.** There is no `ALTER TYPE`, no enum-value ordering problem, and no
one-way door.

Three places claim otherwise and are wrong on this point. ⚠ **Correct them as
each stage lands rather than in one sweep** — a documentation edit that runs
ahead of the code is how the 25 August register got confident and stale:

- `lib/vocabulary.ts` — *"Renaming `want` to `active` is a Postgres enum
  migration with every row in the product behind it"*
- `docs/re-direction/implementation-spec.md` §13 — *"the Postgres enum and §3's
  types and intentions are untouched"*, *"renaming enum values ends [rollback]
  permanently"*
- `CLAUDE.md` — *"the only non-additive one"*

⚠ **What remains true is that it is NON-ADDITIVE**, and that is a real
constraint: code that reads `'want'` breaks on a converted row. That is a deploy
**ordering** problem, and the ordering below is the whole answer to it.

---

## ⚠⚠ THE RUNBOOK'S OWN RULE DOES NOT COVER THIS

`CLAUDE.md` and the Phase 0 runbook say **migrate production first, deploy
second**, and that rule inverted once and cost roughly eighteen hours of 500s.

**It is right for additive changes and wrong here.** Migrating first would leave
live code reading a column whose values it does not recognise. Deploying first
would leave new code reading values that have not been converted. Either order,
done in two steps, has a window where production is broken.

**The shape with no window is expand → migrate → contract.** Every step below is
revert-safe *on its own*, and at no point does a deployed build exist that
cannot read what is in the database.

---

## Stage 1 — status and verdict

`state` conflates two axes. §5 asks the detail surface to show *the user's
intention **and** status* — two fields — and §3's six intentions are the second
axis only. `want`/`done`/`dropped` are lifecycle; `go_back_to` and `fixture` are
**verdicts on a finished thing**, which is not a stage of a life.

```
status:  active | completed | dropped
verdict: null | again | have          (completed only)

want        -> active,    null
done        -> completed, null
go_back_to  -> completed, 'again'
fixture     -> completed, 'have'
dropped     -> dropped,   null
```

⚠ **`dropped` keeps its own status rather than becoming a verdict.** It is a
lifecycle fact — the capture left the pool — and it is *private*, which
`PUBLIC_STATES` depends on. Folding it into `completed` + a verdict would put
the privacy question inside a nullable column, which is the wrong place for the
one guarantee that must fail closed.

### The four steps

| # | What | Why it is safe alone |
|---|---|---|
| **A** | Migration `0012`: add `status`, `verdict`, backfill from `state` | Additive. Deployed code ignores both columns, so a revert push is still a rollback |
| **B** | Deploy: write **both** vocabularies; read `status`/`verdict`, falling back to `state` when null | `state` is still written, so rolling back to pre-B works |
| **C** | Deploy: stop writing `state`; drop the fallback | Nothing reads `state`; a rollback re-reads a column still present |
| **D** | Migration: re-backfill stragglers, `status` → `NOT NULL`, drop `state` | Nothing has read or written it for a whole deploy |

⚠ **B and C are two deploys and must not be merged.** Merging them is the only
way to reach a state where the database has been converted and the code that
wrote it has been rolled back. At one account and ~79 production captures the
window would be seconds — which is an argument for accepting risk, not for the
risk not existing.

⚠ **D re-backfills before tightening**, so a row written by an old build during
the B window is self-healing rather than a constraint violation at the worst
possible moment.

### ⚠ Step A — DONE on development, NOT on production

- `lib/domain.ts` — `CaptureStatus`, `CaptureVerdict`. Nothing reads them.
- `lib/db/schema.ts` — the two columns and `captures_verdict_shape`.
- `drizzle/0012_wet_wendigo.sql` — add, constrain, backfill, **in one file** so
  Drizzle runs it in one transaction and the columns are never present-but-empty.
  Re-runnable (`WHERE status IS NULL`). Its own down is written in the file.
- `scripts/verify-status-backfill.mjs` — reads only, safe against any branch.

**Verified on development, 364 captures across all five states:**

```
ok  done -> completed / null  (1)
ok  dropped -> dropped / null  (14)
ok  fixture -> completed / have  (1)
ok  go_back_to -> completed / again  (21)
ok  want -> active / null  (327)
ok  no capture was left unconverted
ok  no verdict sits on a capture that is not completed
ok  every value is one the domain declares
ok  the re-derived PUBLIC_STATES selects exactly the old rows
```

⚠ **The last line is the one that matters** and it is checked in **both**
directions in SQL: every old-public row is new-public and vice versa. A one-way
check passes on a backfill that also published rows it should not have.

⚠ **The verifier sets `process.exitCode` and never calls `process.exit()`.**
With `process.exit()` it died on a libuv assertion during Neon's teardown and
returned **127 on a run where every check passed**. A verifier that reports
failure on success is worse than none — it is the thing somebody runs before a
production migration.

### Step B — what changes, and the two that need care

**Re-derived, never renamed.** A mechanical find-and-replace does damage in
exactly two places:

- **`PUBLIC_STATES`** → `status IN ('active') OR verdict IN ('again','have')`,
  kept as **two positive allowlists** so the fail-closed property survives: a
  value added and not listed produces a *missing row*, not a leak. ⚠ Note a
  `completed` + `again` capture is public while `status` alone would hide it —
  the failure direction is correct, and it is the test to write.
- **`classify`** in `lib/overlap.ts` — an allowlist of three `(state, intent)`
  pairs deciding every notification. `tests/mark.test.ts` already asserts a
  crossed-off line converges with nobody, which falls out of it being an
  allowlist.

**Mechanical:** `STATE_WORD` and `WHERE_IT_IS` split into status- and
verdict-keyed lookups; `IntentSpec.landsIn` retypes from
`'go_back_to' | 'fixture'` to a verdict (7 rows in `VOCABULARY`, one reader at
`lib/db/captures.ts:1248`); `CaptureState` stops aliasing `EntryState`;
`lib/db/captures.ts` (12 `state:` sites); `components/page-screen.tsx`,
`person-row.tsx`, `search-screen.tsx`, `app/(app)/settled/page.tsx`; four test
files.

⚠ **`COLLECTIONS` is not dead.** `app/(app)/u/[handle]/page.tsx` still reads
`.wants` and `.fixtures` — the last surface on the four-collection vocabulary
Phase 1 deleted everywhere else. It needs converting, not deleting.

### The acceptance test

⚠ **No user-visible copy changes anywhere in stage 1.** *Again*, *Have* and
*Done* are what the screen says before and after; only the stored values move.
So the check is that every probe and every screen is byte-identical — a
screenshot diff is the test, which is an unusually clean thing to have.

Plus one new privacy test: a `completed` + `again` capture is visible on
`/u/[handle]`, and `completed` with a null verdict is not.

---

## Stage 2 — intentions

`see`/`own`/`try`/`read` → §3's six: *experience or try, visit, learn, buy or
acquire, consume, other*.

**Not started, and deliberately a separate stage.** `state` and `intent` are
different axes; converting both at once doubles the blast radius for no benefit,
and stage 2 gets to lean on stage 1 being proven.

⚠ **The mapping is MANY-TO-ONE and stage 1's is not.** `see` and `read` both
become `consume`, so the down migration cannot reconstruct the original from the
value alone — it needs the possibility's `kind`. Decide before writing it
whether that reconstruction is good enough or whether a `legacy_intent` column
is carried for one release.

⚠ **`captures_user_possibility_intent_key` is unique on (user, possibility,
intent).** Collapsing `see` and `read` could in principle collide. It cannot in
practice — a film is not read — but the migration must assert the collision set
is empty rather than assume it.

---

## Order against production

Nothing here has run against production. The sequence is:

1. `scripts/prod-check.sh` — confirm the host and what is applied. **Ask; never
   write down what state production is in.**
2. Step A's migration against production.
3. `scripts/verify-status-backfill.mjs` against production — the same reads,
   against the rows that matter.
4. Then B, C, D in order, each its own deploy or migration.
