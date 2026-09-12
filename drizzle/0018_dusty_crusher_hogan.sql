--> ⚠ HAND-ADDED. drizzle-kit emits the column and not the type it needs, so a
--> generated-only 0018 fails on `type "vector" does not exist`. Neon ships
--> pgvector; this turns it on. `IF NOT EXISTS` so the migration is re-runnable
--> and so an environment that already has it is untouched.
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "capture_akin" (
	"capture_id" uuid NOT NULL,
	"akin_id" uuid NOT NULL,
	"distance" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "capture_akin_capture_id_akin_id_pk" PRIMARY KEY("capture_id","akin_id"),
	CONSTRAINT "capture_akin_not_self" CHECK ("capture_akin"."capture_id" <> "capture_akin"."akin_id")
);
--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN "embedding" vector(1024);--> statement-breakpoint
ALTER TABLE "capture_akin" ADD CONSTRAINT "capture_akin_capture_id_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capture_akin" ADD CONSTRAINT "capture_akin_akin_id_captures_id_fk" FOREIGN KEY ("akin_id") REFERENCES "public"."captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "capture_akin_capture_idx" ON "capture_akin" USING btree ("capture_id","distance");
--> ⚠ NO INDEX ON `captures.embedding`, AND THAT IS A DECISION.
--> The only query that reads it is "the nearest of THIS USER's other captures",
--> run once per capture written — never on a page read. An HNSW index does not
--> serve a filtered scan of one owner's few hundred rows, and it brings
--> `ef_search` with it: a tuned number deciding what the app claims. The day a
--> record is large enough to need one, this is the line, and the pairs table
--> means nothing else has to change.
