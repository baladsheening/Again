ALTER TABLE "captures" DROP CONSTRAINT "captures_source_user_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "captures" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "captures" ADD CONSTRAINT "captures_source_user_id_profiles_id_fk" FOREIGN KEY ("source_user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;