/*
  Phase 0: every legacy entry becomes a private capture.

  Re-runnable. `captures_legacy_entry_key` is unique, and the `not exists`
  below reads it, so a second run of this file inserts nothing rather than a
  second copy of everyone's list. Nothing is deleted and nothing in `entries`
  is touched — the legacy rows stay exactly as they are, which is what makes
  the backfill verifiable against its own source.
*/

INSERT INTO captures (
  user_id,
  text,
  possibility_id,
  intent,
  state,
  return_count,
  note,
  visibility,
  source,
  source_user_id,
  legacy_entry_id,
  created_at,
  resolved_at
)
SELECT
  m.user_id,
  /*
    A film entry never had typed words — it was chosen from a poster grid — so
    the title is the honest reconstruction of what the person meant, and the
    only one available. It is not an invention: it is the name of the thing
    they picked.
  */
  m.title,
  m.item_id,
  m.intent,
  m.state,
  m.return_count,
  m.note,
  /*
    Every migrated row lands private. The convergence pool starts empty and
    fills as people re-share, which is the cost that was accepted because the
    population is the author plus test accounts. Against a real userbase this
    same line is a silent feature outage — see docs/decisions.md.
  */
  'private',
  CASE WHEN m.keeps_provenance
    THEN CASE m.source WHEN 'swap' THEN 'transfer' ELSE m.source END
    ELSE 'self'
  END,
  CASE WHEN m.keeps_provenance THEN m.source_user_id ELSE NULL END,
  m.id,
  m.created_at,
  m.resolved_at
FROM (
  SELECT
    e.*,
    i.title,
    /*
      A copy whose source account is gone — `source_user_id` is ON DELETE SET
      NULL — has nobody left to suppress against, and `captures_provenance_shape`
      will not accept a source that cannot name a person. `self` is the only
      value that is still true of such a row. The same applies to the
      impossible case of a row sourced from its own owner.
    */
    (
      e.source <> 'self'
      AND e.source_user_id IS NOT NULL
      AND e.source_user_id <> e.user_id
    ) AS keeps_provenance
  FROM entries e
  JOIN items i ON i.id = e.item_id
) AS m
WHERE NOT EXISTS (
  SELECT 1 FROM captures c WHERE c.legacy_entry_id = m.id
);

--> statement-breakpoint

/*
  Provenance had only a user to point at before captures existed. Now that both
  sides are rows, the copy can name the capture it came from.

  At most one row can match: `captures_user_possibility_intent_key` is unique on
  exactly this triple, and every migrated row has a non-null possibility and a
  non-null intent. This derives a link that already existed; it does not invent
  one, and it leaves `source_capture_id` null wherever the source capture is not
  there to point at.
*/
UPDATE captures AS c
SET source_capture_id = s.id
FROM captures AS s
WHERE c.source_capture_id IS NULL
  AND c.source_user_id IS NOT NULL
  AND c.possibility_id IS NOT NULL
  AND s.user_id = c.source_user_id
  AND s.possibility_id = c.possibility_id
  AND s.intent IS NOT DISTINCT FROM c.intent;
