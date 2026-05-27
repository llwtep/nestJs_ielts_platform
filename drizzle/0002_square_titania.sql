CREATE TABLE "exam_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"type" text NOT NULL,
	"part_number" integer NOT NULL,
	"title" text,
	"content" text,
	"audio_url" text
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text,
	"title" text
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"question_number" integer NOT NULL,
	"type" text NOT NULL,
	"text" text,
	"options" text,
	"correct_answer" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "posts" CASCADE;--> statement-breakpoint
DROP TABLE "profile" CASCADE;--> statement-breakpoint
ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_section_id_exam_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."exam_sections"("id") ON DELETE cascade ON UPDATE no action;