# Phase 0 — production migration

Status: **plan only. Nothing here has been run against production.**

Migrations `0004`–`0008` have been applied to the Neon `development` branch and
verified there. Production has none of them.

Everything below is written to be run from the repository root on the machine
that holds `.env.local`.

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

```bash
git log origin/main..HEAD --oneline   # the six Phase 0 commits, and nothing else
npm run lint
npm run typecheck
npm run build
```

`npm run test` runs against `development` and refuses to run against production
by hostname. Leave it pointed at `development`.

### 1.2 Confirm which database you are about to touch

`drizzle.config.ts` reads `.env.local` through `dotenv`, which does **not**
override a variable already present in the environment. That is the mechanism
this plan relies on: production is named once, on the command line, and
`.env.local` is never edited.

⚠ **Verify it rather than trusting it.** Before anything else, run the check
below with the production URL in the environment and read the host back:

```bash
DATABASE_URL="$PROD_URL" node -e "
  const { config } = require('dotenv');
  config({ path: '.env.local' });
  console.log(new URL(process.env.DATABASE_URL).hostname);
"
```

It must print the production host. If it prints the development host, `dotenv`
is overriding and this whole procedure would silently run against the wrong
branch — stop, and pass the URL through `drizzle.config.ts` explicitly instead.

### 1.3 The state production is actually in

```sql
select count(*) as entries from entries;
select count(*) as items from items;
select count(*) as profiles from profiles;

-- Must be 0. `0004` adds a check requiring both external columns or neither,
-- and it validates existing rows on the way in.
select count(*) from items
 where (external_source is null) <> (external_id is null);

-- Must be 0. `0005` inner-joins entries to items, so an orphan would be
-- skipped in silence rather than failing loudly.
select count(*) from entries e
 where not exists (select 1 from items i where i.id = e.item_id);

-- Must be 0. `captures_source_is_not_owner` refuses these.
select count(*) from entries where source_user_id = user_id;

-- Expect none; `swap` was designed and never built. Any row here is mapped to
-- `transfer` by the backfill, which is correct — but know it is happening.
select source, count(*) from entries group by 1;

-- Already applied, if anything. Should list 0000-0003 only.
select hash, created_at from drizzle.__drizzle_migrations order by created_at;
```

Write the three counts down. Steps 4.1 and 4.2 compare against them.

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

Do not skip this because the migrations are additive. `0005` writes rows and
`0007` writes a trigger; neither has a down migration, and this project has
none by design.

---

## 3. Apply

```bash
DATABASE_URL="$PROD_URL" npm run db:migrate
```

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

Run all of these before deploying. Every one of them passed on `development`.

### 4.1 The backfill is complete and faithful

```sql
-- Must equal the entries count from 1.3.
select count(*) from captures where legacy_entry_id is not null;

-- Must be 0.
select count(*) from entries e
 where not exists (select 1 from captures c where c.legacy_entry_id = e.id);

-- Must be 0. Eight columns, compared against the rows they came from.
select count(*)
  from captures c
  join entries e on e.id = c.legacy_entry_id
  join items i on i.id = e.item_id
 where c.text is distinct from i.title
    or c.possibility_id is distinct from e.item_id
    or c.intent is distinct from e.intent
    or c.state is distinct from e.state
    or c.return_count is distinct from e.return_count
    or c.note is distinct from e.note
    or c.created_at is distinct from e.created_at
    or c.resolved_at is distinct from e.resolved_at;
```

### 4.2 Privacy and provenance

```sql
-- Must be 0. Every migrated row lands private.
select count(*) from captures where visibility <> 'private';

-- Every row must satisfy the shape: self means both origin columns empty,
-- anything else must name a person. Must return no rows.
select id, source, source_user_id, source_capture_id from captures
 where (source = 'self' and (source_user_id is not null or source_capture_id is not null))
    or (source <> 'self' and source_user_id is null);

-- Sanity, not a guarantee: how the legacy sources mapped.
select source, count(*), count(source_user_id), count(source_capture_id)
  from captures group by 1 order by 1;
```

### 4.3 Timestamps and normalisation

```sql
-- Both must be 0.
select count(*) from captures
 where legacy_entry_id is not null
   and updated_at is distinct from coalesce(resolved_at, created_at);

select count(*) from captures where normalised_text is null or normalised_text = '';

-- Eyeball a few. Lowercased, punctuation collapsed, non-Latin scripts intact.
select text, normalised_text from captures order by created_at limit 5;
```

### 4.4 The constraints exist and are what they claim

```sql
-- Must be 'r' (restrict).
select confdeltype from pg_constraint
 where conname = 'captures_source_user_id_profiles_id_fk';

-- Must return all three.
select conname from pg_constraint
 where conname in ('captures_provenance_shape',
                   'captures_source_is_not_owner',
                   'items_external_pair');

-- Must return one row with tgenabled = 'O'.
select tgname, tgenabled from pg_trigger
 where tgname = 'profiles_retire_capture_source';

-- Must list 0004-0008 as applied.
select hash, created_at from drizzle.__drizzle_migrations order by created_at;
```

If any check in §4 fails, **stop and do not deploy.** The old code is still
running and still correct; there is no time pressure.

---

## 5. Deploy, and the smoke checks

Merge PR #1, or push the branch to `main` — either is the deploy, and §1–§4
must all have passed before this point.

```bash
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
