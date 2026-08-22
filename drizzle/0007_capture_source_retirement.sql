/*
  Two corrections to the Phase 0 capture table.

  1. `updated_at` arrived in 0006 with a default of now(), which stamped every
     migrated row with the moment of the migration rather than the moment the
     row last changed. A backfilled capture last moved when it resolved, or
     when it was created if it never did. That is derivable, so it is not
     guessed.
*/

UPDATE captures
SET updated_at = COALESCE(resolved_at, created_at)
WHERE legacy_entry_id IS NOT NULL;

--> statement-breakpoint

/*
  2. A capture whose source account is deleted has to stop being a copy.

  `source_user_id` used to be ON DELETE SET NULL, which produced a row saying
  `source = 'copy'` with nobody to name — a state `captures_provenance_shape`
  refuses. The referential action would have raised on the check and aborted
  the deletion, and it would have done so at whatever moment someone first
  deleted an account, not at the moment the decision was made.

  So the conversion runs before the delete, in the same transaction as the
  delete, and 0006 changed the constraint to ON DELETE RESTRICT so that a
  deletion which somehow skipped it fails loudly instead of leaving a capture
  that cannot say where it came from.

  ⚠ **This is a trigger rather than a function in `lib/db/` because Better
  Auth deletes `user` rows through its own adapter**, and a cascade from
  `user` to `profiles` never passes through this application's data layer. A
  conversion written in `lib/db/` would be bypassed by the code most likely to
  need it. It is the one piece of behaviour in this schema that does not live
  in `lib/db/`, and that is why.

  Converting to `self` is not an invention of provenance. There is no longer
  anyone to suppress a convergence against — the account is gone, and so are
  its captures — so self-sourced is the only description still true of the
  row. `source_capture_id` clears with it, because the capture it pointed at
  is being deleted by the same cascade and because a self-sourced capture must
  carry neither half of a provenance.
*/

CREATE OR REPLACE FUNCTION captures_retire_source_user() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE captures
     SET source = 'self',
         source_user_id = NULL,
         source_capture_id = NULL,
         updated_at = now()
   WHERE source_user_id = OLD.id;
  RETURN OLD;
END;
$$;

--> statement-breakpoint

DROP TRIGGER IF EXISTS profiles_retire_capture_source ON profiles;

--> statement-breakpoint

CREATE TRIGGER profiles_retire_capture_source
BEFORE DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION captures_retire_source_user();
