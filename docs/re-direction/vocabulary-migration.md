# The vocabulary migration

**Stage 1 is DONE except the final drop — A, B, C1 and C2 are all applied to
production and deployed, 3–4 September. Only C3 remains, and it is deliberately
not done.**

| step | what | state |
|---|---|---|
| **A** | `0012`: add `status`/`verdict`, backfill | ✅ production |
| **B** | read the new columns, write both | ✅ production |
| **C1** | `0013`: heal, then `status NOT NULL` | ✅ production |
| **C2** | `0014`: `state` nullable; nothing reads it | ✅ production |
| **C3** | `DROP COLUMN state` | ⛔ **not done, on purpose** |

⚠ **C3 is the only irreversible act in the migration and there is no reason to
hurry it.** The column is written, read by nothing, and costs nothing sitting
there. Time is what tells you the seven derivations are right on real data. When
it is done: deploy that stops WRITING `state` first, then the migration that
drops it — subtractive ordering, the same rule as C2.

⚠ **Verified on production after each step** — `scripts/prod-verify-status.sh`,
which checks the mapping in both directions in SQL over every row. Last reading:
81 captures, four groups, zero unconverted, and the re-derived `PUBLIC_STATES`
selecting exactly the old set.

**Stage 2 — the intentions — has not started.** See the section at the foot.

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
| **A** | Migration `0012`: add `status`, `verdict`, backfill from `state` — ⚠ **then** deploy A's code | Additive. Once the columns exist, old and new code both work |
| **B** | Deploy: **write both** vocabularies, **read the new one** — ⚠ then re-run the backfill | `state` is still written, so a rollback to pre-B reads a column that is still current |
| **C** | Later, once B has run for a while: deploy that stops writing `state`, **then** the migration that tightens `status` and drops it | Nothing has read or written `state` for a whole deploy |

### ⚠ Three steps, not four — the dual-write is what buys the reduction

An earlier draft had four, with B reading the new columns *through a fallback*
(`status`, or derive it from `state` when null) and C removing the fallback.

**The fallback is scaffolding that exists for one window and is then deleted,**
and it would have put a second definition of the mapping into TypeScript beside
the one in SQL — two things to keep true, which is what `lib/domain.ts` says
about the visibility conjunction and for the same reason.

**Removing the condition instead:** the only rows that can have a null `status`
are ones written by code that does not write it yet, and the backfill is
**re-runnable by construction** (`WHERE status IS NULL`). So run it again and
there is nothing for a fallback to catch. A re-runnable statement we already
have beats a code path we would have to write, test and then delete.

⚠⚠ **THE RE-RUN GOES AFTER B'S DEPLOY, NOT BEFORE — this was written the wrong
way round first.** The window does not close when the migration lands; it closes
when **something starts writing `status`**, which is B. Re-running before B heals
everything up to that moment and then leaves the deploy itself — thirty-five
seconds of a rollout during which the old build is still serving — able to
create another straggler. Re-running *after* closes it permanently, because by
then every writer writes both columns and none can be made.

**The general form, worth keeping:** a heal runs after the change that stops the
damage, never before it. Running it first is treating the symptom on a mechanism
that is still live.

⚠ **The dual-write stays all the way to C, and it is what protects rollback.**
Two extra assignments on each write is a small price for *every deploy in the
sequence being revertible*. Do not remove it early to tidy up: the moment
`state` stops being written, a rollback reads stale rows.

### ⚠⚠ THE RULE, STATED PROPERLY: ADDITIVE MIGRATIONS GO FIRST, SUBTRACTIVE ONES GO LAST

**An earlier draft of this file said step A's code could be deployed before its
migration because "deployed code ignores both columns". That is false, and it
would have reproduced the 25 August outage.**

`lib/db/captures.ts` has **three bare `select().from(captures)`** — the
idempotency check at 986, the upsert-collision read at 1101, and
`getCaptureByClientMutationId` at 1457 — plus **nine `.returning()`** calls and
a `getTableColumns(captures)`. Drizzle expands every one of those from the
schema object, so adding a column to `schema.ts` changes the SQL those queries
emit whether or not anybody wrote the column's name.

Measured, not reasoned — with the project's own driver:

```
bare select() expands status:  true
bare select() expands verdict: true
```

So deploying step A's code against an unmigrated production would issue
`SELECT …, "captures"."status", "captures"."verdict" …` against a table without
them, and **every capture write and every idempotency check would 500** — which
is the 25 August failure with a wider blast radius, since those are bare selects
rather than three named columns.

The rule that covers both ends of this migration:

- **Additive** (A) — migration first, deploy second. `CLAUDE.md`'s rule, and it
  applies exactly.
- **Subtractive** (D, dropping `state`) — deploy first, migration second.
  `CLAUDE.md`'s rule **inverted**, for the mirror-image reason: a column dropped
  while a deployed build still selects it fails the same way.
- **Value conversion** (B→C) — neither order is safe in two steps, which is why
  it is three: write both, then stop writing the old one.

⚠ **`CLAUDE.md` states only the first of those three.** That is not a fault in
the rule — it was written for the additive case and says so — but a reader
applying it to D or to B would break production. Correct `CLAUDE.md` when stage
1 is done, not before.

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

### ⚠ Step B's scope was cut in half, and the cut is what makes it verifiable

The first scoping had B converting the data layer **and** the components in one
deploy — `CaptureCard.state` becoming `status`/`verdict`, and `STATE_WORD`,
`WHERE_IT_IS`, `person-row`, `search-screen`, `settled` and the console all
following it. That is one change with two audiences and no way to tell which
half broke something.

**B stops at the data layer.** `lib/db/` reads and writes `status`/`verdict`,
and the projections keep exposing a `state` field **derived from them**. Not one
component changes.

- **The acceptance test becomes trivially true.** *No user-visible copy changes*
  stops being a claim to check and becomes a property of the diff: no file under
  `components/` or `app/` is touched, so a screenshot cannot differ.
- **It is independently deployable and independently revertible**, which is the
  whole reason the sequence is stepped at all.
- **B2** then moves the UI onto the two axes and deletes the derivation. It has
  no database work in it, so it can be judged on screen alone — which is the
  only way this app judges an interface.

⚠ **`PUBLIC_STATUSES` and `PUBLIC_VERDICTS` are already written** (`lib/domain.ts`)
and are read by nothing yet. They are B's, not A's, and they are there because
the re-derivation is the part worth getting right before there is any pressure
to hurry it.

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
