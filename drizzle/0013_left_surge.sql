/*
  ─────────────────────────────────────────────────────────────────────────────
   The vocabulary migration, stage 1 — STEP C1. 3 September.
  ─────────────────────────────────────────────────────────────────────────────

  `status` becomes NOT NULL. It was nullable for exactly as long as it had to
  be: step A added it to a populated table, which cannot be done with a
  constraint attached. Step B made every writer set it. This is the database
  saying so permanently.

  ⚠ THIS IS NOT THE STEP THAT DROPS `state`. That is C3, it comes after a
  deploy that stops reading the column, and it is the only irreversible act in
  the whole migration. Everything here is undone by ALTER COLUMN status DROP
  NOT NULL.

  ⚠ THE RE-BACKFILL RUNS FIRST, AND IT IS NOT DEFENSIVE PADDING. A capture
  written by a pre-step-B build carries a correct `state` and no status, and
  ALTER ... SET NOT NULL validates every existing row — so one such row fails
  the whole migration. It is the same re-runnable statement 0012 carries
  (`where status is null`), and against a converted database it updates
  nothing. Production measured zero unconverted rows before this was written;
  this is what makes that true at the moment it matters rather than an hour
  earlier.

  ⚠ VERDICT STAYS NULLABLE, deliberately — null is a real value there, not a
  missing one. A completed capture with no opinion attached is today's `done`.
  See `CaptureVerdict` in lib/domain.ts.

  DOWN:

      ALTER TABLE captures ALTER COLUMN status DROP NOT NULL;
*/

UPDATE captures
SET
  status = CASE state
    WHEN 'want'       THEN 'active'
    WHEN 'done'       THEN 'completed'
    WHEN 'go_back_to' THEN 'completed'
    WHEN 'fixture'    THEN 'completed'
    WHEN 'dropped'    THEN 'dropped'
  END,
  verdict = CASE state
    WHEN 'go_back_to' THEN 'again'
    WHEN 'fixture'    THEN 'have'
    ELSE NULL
  END
WHERE status IS NULL;
--> statement-breakpoint
ALTER TABLE "captures" ALTER COLUMN "status" SET NOT NULL;