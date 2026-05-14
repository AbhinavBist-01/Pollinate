ALTER TABLE "options" ADD COLUMN "is_correct" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "respondent_name" varchar(255);