CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"status" text DEFAULT 'IN_PROGRESS',
	"scores" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" integer NOT NULL,
	"type_of_section" text NOT NULL,
	"answer_text" text NOT NULL,
	"is_correct" boolean
);
--> statement-breakpoint
CREATE TABLE "exam_sections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"exam_id" uuid NOT NULL,
	"type" text NOT NULL,
	"part_number" integer NOT NULL,
	"title" text,
	"content" text,
	"content_url" text
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text,
	"title" text
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" uuid NOT NULL,
	"question_number" integer NOT NULL,
	"type" text NOT NULL,
	"text" text,
	"options" text,
	"correct_answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"password" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_section_id_exam_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."exam_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_question_idx" ON "user_answers" USING btree ("attempt_id","question_id");