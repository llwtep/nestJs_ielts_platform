CREATE INDEX "attempt_user_id_idx" ON "attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attempt_exam_id_idx" ON "attempts" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "user_answers_question_id_idx" ON "user_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "exam_sections_exam_id_idx" ON "exam_sections" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "questions_section_id_idx" ON "questions" USING btree ("section_id");