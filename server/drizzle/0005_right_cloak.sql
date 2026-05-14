ALTER TABLE "polls" ADD COLUMN "status" varchar(20) DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "vote_limit_per_session" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "voter_key" varchar(255);--> statement-breakpoint
CREATE INDEX "responses_voter_key_idx" ON "responses" USING btree ("voter_key");