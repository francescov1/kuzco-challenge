CREATE TYPE "public"."message_role" AS ENUM('system', 'user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('success', 'error');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"shard_id" text NOT NULL,
	"messages" jsonb NOT NULL,
	"model" text NOT NULL,
	"status" "status" NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "batch_id_idx" ON "requests" USING btree ("batch_id");