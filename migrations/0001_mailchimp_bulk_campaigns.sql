ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "provider" varchar(50) DEFAULT 'sendgrid' NOT NULL;
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "provider_campaign_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "provider_segment_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "provider_audience_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "provider_error" text;
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(64);
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "attachments" jsonb;
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "recipient_permission_basis" varchar(100);
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "recipient_permission_confirmed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "recipient_permission_confirmed_by" varchar;
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "excluded_count" integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD COLUMN IF NOT EXISTS "unsubscribed_count" integer DEFAULT 0;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_campaigns_idempotency_key_unique" ON "email_campaigns" ("idempotency_key");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_recipient_permission_confirmed_by_users_id_fk"
    FOREIGN KEY ("recipient_permission_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "provider_member_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "provider_member_hash" varchar(255);
--> statement-breakpoint
ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "provider_status" varchar(50);
--> statement-breakpoint
ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "exclusion_reason" text;
--> statement-breakpoint
ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "unsubscribed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "permission_basis" varchar(100);
--> statement-breakpoint
ALTER TABLE "email_campaign_recipients" ADD COLUMN IF NOT EXISTS "permission_confirmed_at" timestamp;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "bulk_email_user_configs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "audience_id" varchar(255) NOT NULL,
  "from_email" varchar(255) NOT NULL,
  "from_name" varchar(255) NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "ready_at" timestamp,
  "last_checked_at" timestamp,
  "readiness_error" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bulk_email_user_configs_user_id_unique" ON "bulk_email_user_configs" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bulk_email_user_configs_audience_id_unique" ON "bulk_email_user_configs" ("audience_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bulk_email_user_configs_enabled" ON "bulk_email_user_configs" ("enabled");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "bulk_email_user_configs" ADD CONSTRAINT "bulk_email_user_configs_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;