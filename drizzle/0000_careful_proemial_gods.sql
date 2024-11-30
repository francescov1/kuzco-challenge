CREATE TYPE "public"."status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_response_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"shard_id" text NOT NULL,
	"messages" jsonb NOT NULL,
	"model" text NOT NULL,
	"status" "status" NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_shards_count" integer NOT NULL,
	"completed_shards_count" integer DEFAULT 0 NOT NULL,
	"total_llm_requests_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completion_webhook_url" text,
	"completed_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "llm_response_records" ADD CONSTRAINT "llm_response_records_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_id_idx" ON "llm_response_records" USING btree ("batch_id");