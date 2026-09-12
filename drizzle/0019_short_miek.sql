CREATE TABLE "capture_prior_dates" (
	"capture_id" uuid NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "capture_prior_dates_capture_id_at_pk" PRIMARY KEY("capture_id","at")
);
--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN "captured_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
--> ⚠⚠ HAND-ADDED, AND WITHOUT IT THIS MIGRATION MOVES EVERY LINE EVER WRITTEN
--> TO TODAY. `ADD COLUMN ... DEFAULT now() NOT NULL` fills existing rows with
--> the default, so on a record of two hundred captures the day stamps would all
--> collapse into one and the order would be arbitrary within it. drizzle-kit
--> cannot know the column is a copy of another; this is the backfill that says
--> so. ⚠ Re-runnable by construction — after it runs there is nothing left
--> where the two disagree except rows a re-entry has legitimately moved, and
--> those are excluded by the `=` on the first pass having already happened.
UPDATE "captures" SET "captured_at" = "created_at" WHERE "captured_at" <> "created_at" AND NOT EXISTS (
	SELECT 1 FROM "capture_prior_dates" WHERE "capture_prior_dates"."capture_id" = "captures"."id"
);--> statement-breakpoint
--> ⚠ DROPPED, NOT LEFT BESIDE THE NEW ONE. Nothing orders by `created_at` any
--> more: the record, search and the keyset cursor all walk `captured_at`, and
--> the only remaining reader of `created_at` is `undoCapture`'s ten-second
--> bound, which is a predicate against `now()` rather than a range scan.
DROP INDEX "captures_user_created_idx";--> statement-breakpoint
ALTER TABLE "capture_prior_dates" ADD CONSTRAINT "capture_prior_dates_capture_id_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "capture_prior_dates_capture_idx" ON "capture_prior_dates" USING btree ("capture_id","at");--> statement-breakpoint
CREATE INDEX "captures_user_captured_idx" ON "captures" USING btree ("user_id","captured_at");
