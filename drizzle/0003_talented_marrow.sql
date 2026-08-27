ALTER TABLE "questions" ALTER COLUMN "options" SET DATA TYPE jsonb USING "options"::jsonb;--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "duration_minutes" integer DEFAULT 165 NOT NULL;