# Phase 0 — production migration

Status: **plan only. Nothing here has been run against production.**

Migrations `0004`–`0008` have been applied to the Neon `development` branch and
verified there. Production has none of them.

Everything below is run from the repository root on the machine that holds
`.env.local`.

⚠ **The operator shell is PowerShell**, which is what this checkout has. Every
command is written for it literally — no `VAR=value cmd` prefixes, no `$VAR`
expansion, no here-strings from another shell. Where a POSIX equivalent is
useful it is given underneath, marked as such, and is not the version to run.

PowerShell has no inline environment prefix, so `DATABASE_URL` is set as a
session variable in §1.2 and removed again in §4.5. It is set **once**, and
every command that needs it — the preflight, the migration, the verification —
is between those two lines.

---

## The order, and why it is not the other one

> **Migrate production first. Deploy second.**

⚠ **Merging the pull request *is* the deploy.** There is no separate release
step to hold: a merge to `main` ships, and so does a push to it. So approving
the PR and merging it are two different decisions with §1–§4 in between —
approve, migrate, verify, *then* merge. Treating approval and merge as one
gesture is the exact mistake this ordering exists to prevent, and it is an easy
one to make because every other change in this repository has been safe to
merge the moment it was approved.

The whole sequence, end to end:

> review and approve → run §1–§4 against production while the PR is still
> unmerged → merge, or push to `main` (this is the deploy) → §5's smoke checks

The deployed code today writes and reads `entries`, never `captures`, and it
passes `external_source` and `external_id` explicitly on every insert — so
nothing in `0004`–`0008` changes what it does. Migrating first leaves a working
app.

Deploying first does not. `app/(app)/layout.tsx` calls `countMyCaptures`, so
the first request to any signed-in page hits a table that does not exist and
throws. There is no partial-availability version of that ordering: every
authenticated route is behind that layout.

---

## 1. Preflight

### 1.1 The tree that is about to ship

```powershell
git log origin/main..HEAD --oneline   # Phase 0 only, and nothing else
npm run lint
npm run typecheck
npm run build
```

`npm run test` runs against `development` and refuses to run against production
by hostname. Leave it pointed at `development`.

### 1.2 Point at production, and confirm it

```powershell
$env:DATABASE_URL = '<the production connection string>'
npm run migration:preflight
```

POSIX equivalent, not the version to run:
`export DATABASE_URL='…' && npm run migration:preflight`

`drizzle.config.ts` and both scripts read `.env.local` through `dotenv`, which
does **not** override a variable already present in the environment. That is
the mechanism this procedure relies on: production is named once, in the
session, and `.env.local` is never edited.

⚠ **The first two lines of the output are the host and the database name, and
they are printed before any check runs.** A runbook step that says *confirm the
host* is a step that gets skipped; this one cannot be. If it prints the
development host, `dotenv` is overriding and the whole procedure would have run
against the wrong branch — stop.

### 1.3 The state production is actually in

The same command. `npm run migration:preflight` reads and writes nothing, and
it reports two things beyond the host:

**Counts** — entries, items, profiles. Write them down; §4 compares against
them.

**Three preconditions, each of which must be zero**, and each of which would
otherwise fail part-way through a migration rather than before one:

- `items` rows with half an external pair — `0004` adds a check requiring both
  external columns or neither, and validates every existing row on the way in.
- `entries` orphaned from `items` — `0005` inner-joins them, so an orphan is
  skipped **in silence** rather than failing loudly.
- `entries` sourced from their own owner — `captures_source_is_not_owner`
  refuses these, and the backfill would abort.

It also prints the spread of legacy `source` values. `swap` was designed and
never built; any row holding it is mapped to `transfer` by the backfill, which
is correct, but it is worth knowing that it happened.

**The baseline.** Two checks that must hold before any of this applies: four
applied migrations — `0000`–`0003` — and no `captures` table. Without them the
script would pass on a database that is already migrated or half-migrated, and
`PREFLIGHT OK` would mean nothing beyond *the connection works*.

⚠ **The `development` branch fails this, correctly**, because it is already
past the baseline. Preflight cannot be rehearsed there; `npm run
migration:verify` is the rehearsal that applies to it, and it passes.

⚠ **If production reports more than four migrations, stop and read §6.3.** A
partly-applied set is not something to fix by running the migration again.

**`PREFLIGHT OK` on the last line, or stop.**

---

## 2. Backup

**Take a Neon branch from production immediately before migrating.** It is the
recovery path in §6, it is instant, and it costs nothing to keep for a week.

```
Neon console → project → Branches → New branch
  Parent:  production
  From:    current point in time
  Name:    pre-phase-0-YYYY-MM-DD
```

Record the branch name and its creation timestamp. The timestamp is what a
point-in-time restore needs if the branch itself is lost.

⚠ **This step is the only one in the document done by hand, and it belongs to
whoever owns the Neon account rather than to whoever is running the commands.**
Nothing in this repository can take it: `DATABASE_URL` is a Postgres
connection and cannot create a branch, and no Neon CLI is authenticated here.

It can be handed over — `neonctl auth`, then
`neonctl branches create --name pre-phase-0-YYYY-MM-DD` — but that is a
decision rather than a convenience. A Neon session or API key can create *and
delete* branches across the whole project, production included, which is
considerably more authority than the database URL it would sit beside. For a
step that happens once, the console is also faster.

Do not skip this because the migrations are additive. `0005` writes rows and
`0007` writes a trigger; neither has a down migration, and this project has
none by design.

---

## 3. Apply

```powershell
npm run db:migrate
```

`DATABASE_URL` is still set from §1.2. Do not set it again here — one place to
get it wrong is enough.

Five files, in order. What each does, and what to expect:

| | what it does | risk |
|---|---|---|
| `0004` | creates `captures`; `items.external_source`/`external_id` become nullable and lose the `'tmdb'` default; adds `items_external_pair` | the check validates every `items` row under `ACCESS EXCLUSIVE`; sub-second at this size |
| `0005` | backfills every entry into a private capture, then derives `source_capture_id` | re-runnable; inserts nothing on a second pass |
| `0006` | adds `captures.updated_at`; `source_user_id` becomes `ON DELETE RESTRICT` | none — `captures` has no rows referencing a profile yet |
| `0007` | corrects `updated_at` on migrated rows; creates `captures_retire_source_user()` and the `before delete` trigger on `profiles` | needs table ownership; `neondb_owner` has it |
| `0008` | adds the generated `normalised_text` and its index | rewrites `captures`; sub-second at this size, a table rewrite at a large one |

Each migration runs in its own transaction. A failure leaves the ones before it
applied and the failing one rolled back — which is why §6 recovery is a branch
restore rather than a hand-written down migration.

---

## 4. Post-migration checks

```powershell
npm run migration:verify
```

Reads, writes nothing. Every check in it passed on `development` before this
runbook was written, and the SQL lives in `scripts/migration-verify.mjs` rather
than in this document — a procedure that asks an operator to paste fifteen
statements into a console has fifteen chances to paste one wrong, and the prose
copy drifts from the real one the first time either is edited.

What it asserts, in the order it prints:

**4.1 — the backfill is complete and faithful.** Every entry has a capture; no
entry is without one; and no migrated capture differs from the row it came from
across eight columns — text, possibility, intent, state, return count, note,
created and resolved timestamps.

**4.2 — privacy and provenance.** No capture is anything but private. No
capture holds a provenance that cannot be true: `self` with an origin, or a
non-self source with nobody to name.

**4.3 — timestamps and normalisation.** `updated_at` on every migrated row is
the moment it last moved rather than the moment of the migration, and
`normalised_text` is populated for every capture. It prints a sample so the
normalisation can be eyeballed — lowercased, punctuation collapsed, non-Latin
scripts intact.

**4.4 — the constraints exist and are what they claim.** `source_user_id` is
`restrict`; the three check constraints are present; the retirement trigger
exists and is enabled; nine migrations are applied.

It also prints the provenance spread, which is context rather than a check.

⚠ **`VERIFY OK — safe to deploy` on the last line, or do not deploy.** If
anything failed, the old code is still running and still correct: there is no
time pressure, and §6.1 is still clean because nothing has been deployed.

### 4.5 Put the variable away

```powershell
Remove-Item Env:DATABASE_URL
```

PowerShell has no inline environment prefix, so the variable set in §1.2 lives
for the whole session — including any `npm run test` or `npm run dev` typed
into the same window afterwards. Both test files refuse to run against the
production host by name, which is a backstop and not a reason to leave it set.

---

## 5. Deploy, and the smoke checks

Merge PR #1, or push the branch to `main` — either is the deploy, and §1–§4
must all have passed before this point.

```powershell
git push --ipv4 origin HEAD:main
vercel ls    # watch it land, ~25s
```

Then, signed in as a real account:

1. **`/wants`, `/go-back-tos`, `/fixtures`, `/archive`** all render, and hold
   the same rows as before the deploy. The rail counts match what they were.
2. **Add a film.** It appears in Wants. `select * from captures order by
   created_at desc limit 1` shows `source = 'self'`, `visibility = 'private'`,
   a non-null `possibility_id`, and `normalised_text` derived from the title.
3. **Undo it within ten seconds.** The row is gone from `captures`, and
   `entries` is untouched throughout.
4. **Cross a want off, then restore it.** It stays in position, struck through,
   and comes back where it was.
5. **Resolve a want** both ways. `state` lands in `go_back_to`/`fixture` or
   `done`, and `resolved_at` is set.
6. **Open a film screen** for something already on your list. The tick is
   right, which exercises `/api/film/[id]` against `listMyCapturesForExternalId`.
7. **`/u/[handle]` for another account.** A non-mutual sees *This list is not
   shared with you*. A mutual sees an empty list — **expected**, because every
   migrated capture is private and nothing can share one until Phase 2.
8. **`select count(*) from notifications where created_at > now() - interval
   '1 hour'`** — expect 0. Convergence is quiet by construction until captures
   are shared.
9. **Confirm nothing wrote to the legacy table**: `select max(created_at) from
   entries` is unchanged from before the deploy, and stays unchanged.

---

## 6. Recovery

### 6.1 Before any capture-only write has happened

Clean, and both directions work:

- **Code**: Vercel instant rollback to the previous deployment. The old code
  ignores `captures` entirely and is unaffected by the nullable columns, so it
  runs correctly against the migrated schema. This is the first thing to reach
  for.
- **Schema**: restore the `pre-phase-0-…` branch from §2, or point-in-time
  restore to its timestamp.

### 6.2 After people have started saving

⚠ **This is the part that is not symmetric, and it is the reason to keep the
window between §5's deploy and §5's smoke checks short.**

Once the new code has written a capture, that capture exists in `captures` and
has no row in `entries`. Rolling the code back does not lose the data, but it
makes it invisible: the old screens read `entries`, and nothing has written
there since the deploy.

So after the first capture-only write:

- **Prefer rolling forward.** Fix and redeploy. Almost anything that goes wrong
  in Phase 0 is a read-path fault, and the data underneath it is intact.
- **If the code must go back**, replay the gap first. Captures written after
  the deploy are exactly those with `legacy_entry_id is null`; each one with a
  non-null `possibility_id` and `intent` maps back onto an `entries` row. Write
  that replay before rolling back, not after.
- **Do not restore the database to §2's branch** to undo a code fault. It would
  discard every capture written since the deploy, which is the only copy of
  them.

### 6.3 If a migration fails part-way

The failing migration rolled back; the ones before it did not. Restore the §2
branch and start again from §3 — there are no down migrations, and hand-writing
one under time pressure is how a backfill gets applied twice.

`0005` is the exception worth knowing: it is re-runnable by construction, so a
failure *after* it is safe to retry without restoring, once whatever failed is
fixed.

---

## What this migration deliberately does not do

- **`entries` is not dropped**, and neither is `captures.legacy_entry_id`. They
  are the comparison surface for §4, and dropping them belongs in a later,
  separate migration once production has been verified and lived in.
- **Nothing becomes shared.** Every capture is private and there is no control
  that changes it until Phase 2. The social half of the product is dormant
  between this deploy and that one, by design.
