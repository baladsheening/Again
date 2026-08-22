CREATE TABLE "captures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"possibility_id" uuid,
	"intent" text,
	"state" text NOT NULL,
	"return_count" integer DEFAULT 0 NOT NULL,
	"note" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"source" text DEFAULT 'self' NOT NULL,
	"source_capture_id" uuid,
	"source_user_id" uuid,
	"client_mutation_id" text,
	"legacy_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "captures_user_possibility_intent_key" UNIQUE("user_id","possibility_id","intent"),
	CONSTRAINT "captures_user_client_mutation_key" UNIQUE("user_id","client_mutation_id"),
	CONSTRAINT "captures_legacy_entry_key" UNIQUE("legacy_entry_id"),
	CONSTRAINT "captures_provenance_shape" CHECK (case when "captures"."source" = 'self'
            then "captures"."source_user_id" is null and "captures"."source_capture_id" is null
            else "captures"."source_user_id" is not null
          end),
	CONSTRAINT "captures_source_is_not_owner" CHECK ("captures"."source_user_id" is null or "captures"."source_user_id" <> "captures"."user_id")
);
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "external_source" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "external_source" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "external_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_possibility_id_items_id_fk" FOREIGN KEY ("possibility_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_source_capture_id_captures_id_fk" FOREIGN KEY ("source_capture_id") REFERENCES "public"."captures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_source_user_id_profiles_id_fk" FOREIGN KEY ("source_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_legacy_entry_id_entries_id_fk" FOREIGN KEY ("legacy_entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "captures_possibility_intent_state_idx" ON "captures" USING btree ("possibility_id","intent","state");--> statement-breakpoint
CREATE INDEX "captures_user_state_idx" ON "captures" USING btree ("user_id","state");--> statement-breakpoint
CREATE INDEX "captures_user_created_idx" ON "captures" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_external_pair" CHECK (("items"."external_source" is null) = ("items"."external_id" is null));