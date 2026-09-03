ALTER TABLE "captures" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN "verdict" text;--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_verdict_shape" CHECK ("captures"."verdict" is null or "captures"."status" = 'completed');--> statement-breakpoint
/*
  ─────────────────────────────────────────────────────────────────────────────
   The vocabulary migration, stage 1 — STEP A of four. 3 September.
  ─────────────────────────────────────────────────────────────────────────────

  Splits `state`'s two conflated axes into the two the specification describes
  (§3, §5): a three-value lifecycle, and a verdict on a finished capture.

      want        -> active,    null
      done        -> completed, null
      go_back_to  -> completed, 'again'
      fixture     -> completed, 'have'
      dropped     -> dropped,   null

  ⚠ THE BACKFILL IS IN THE SAME FILE AS THE ADD, ON PURPOSE. Drizzle runs a
  migration file in one transaction, so the columns arrive already correct and
  there is never a moment where a row exists with a null `status` and a
  non-null `state`. Two files would be two states of the world to reason about
  for no benefit.

  ⚠ NOTHING READS THESE COLUMNS YET. `state` is untouched and is still what
  every reader and every writer uses, which is what makes this step additive:
  the deployed code ignores both columns entirely, so a revert push is still a
  rollback. Step B is the deploy that starts writing both.

  ⚠ RE-RUNNABLE. The predicate is `status is null`, so a second run touches
  nothing — the property `0005_backfill_captures.sql` has for the same reason.

  DOWN, should it ever be wanted — and unlike an enum rename, it is complete:

      ALTER TABLE captures DROP CONSTRAINT captures_verdict_shape;
      ALTER TABLE captures DROP COLUMN verdict;
      ALTER TABLE captures DROP COLUMN status;

  `state` still holds every value, so nothing is reconstructed and nothing is
  lost. That is the whole reason this column pair is added beside `state`
  rather than replacing it.
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
