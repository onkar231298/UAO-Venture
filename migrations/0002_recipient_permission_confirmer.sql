ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "permission_confirmed_by" varchar;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "email_campaign_recipients" ADD CONSTRAINT "email_campaign_recipients_permission_confirmed_by_users_id_fk"
    FOREIGN KEY ("permission_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;