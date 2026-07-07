CREATE TABLE IF NOT EXISTS "uploaded_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "file_name" varchar(255) NOT NULL,
  "file_url" varchar(1000) NOT NULL,
  "s3_key" varchar(500) NOT NULL,
  "file_size" integer,
  "mime_type" varchar(100),
  "qr_code_data_url" text,
  "uploaded_by" varchar,
  "created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
