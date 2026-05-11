ALTER TABLE "answers" DROP CONSTRAINT "answers_option_id_options_id_fk";
--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "option_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "value" text;