ALTER TABLE "items" ADD COLUMN "qualifier" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "image_path" text;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "open_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
/*
  Amendments 6 and 7. Both backfills are re-runnable — the `is null` guard on
  the target is what makes a second run write nothing rather than overwrite a
  value somebody has since corrected by hand.

  ⚠ **Without them the two columns are right and the screen is empty.** Every
  possibility in production is a TMDB film, so a rail reading `image_path`
  would admit nothing at all and a tile reading `qualifier` would print a blank
  line under every poster. The columns are additive; the DATA is what makes
  them true.

  ⚠ **Neither source column is dropped.** `year` is an integer, so it still
  sorts and still tells two films of one title apart, which a string cannot;
  `metadata.posterPath` stays where it is. Superseded is not deleted — see the
  vocabulary migration, whose only outstanding step is a DROP COLUMN nobody has
  needed to take.
*/
UPDATE "items" SET "qualifier" = "year"::text
  WHERE "qualifier" IS NULL AND "year" IS NOT NULL;--> statement-breakpoint
UPDATE "items" SET "image_path" = "metadata"->>'posterPath'
  WHERE "image_path" IS NULL AND "metadata"->>'posterPath' IS NOT NULL;
