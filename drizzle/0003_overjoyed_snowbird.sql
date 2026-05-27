CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"exam_id" integer NOT NULL,
	"status" text DEFAULT 'IN_PROGRESS',
	"scores" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"typeOfSection" text NOT NULL,
	"answer_tex" text NOT NULL,
	"is_correct" boolean
);
--> statement-breakpoint
ALTER TABLE "exam_sections" RENAME COLUMN "audio_url" TO "content_url";--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;