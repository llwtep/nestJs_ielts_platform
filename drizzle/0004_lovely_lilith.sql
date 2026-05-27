ALTER TABLE "user_answers" RENAME COLUMN "typeOfSection" TO "type_of_section";--> statement-breakpoint
ALTER TABLE "user_answers" RENAME COLUMN "answer_tex" TO "answer_text";--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_question_idx" ON "user_answers" USING btree ("attempt_id","question_id");