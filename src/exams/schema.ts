
import { relations } from "drizzle-orm";
import { uuid, text, integer, serial} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const exams=pgTable('exams',{
    id:uuid('id').primaryKey(),
    type:text('type'),
    title:text('title')
})

export const examSections = pgTable('exam_sections', {
  id: uuid('id').primaryKey(),
  examId: uuid('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  partNumber: integer('part_number').notNull(), 
  title: text('title'), 
  content: text('content'), 
  contentUrl: text('content_url'), 
}); 

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  sectionId: uuid('section_id').references(() => examSections.id, { onDelete: 'cascade' }).notNull(),
  questionNumber: integer('question_number').notNull(), 
  type: text('type').notNull(), 
  text: text('text'), 
  options: text('options'), 
  correctAnswer: text('correct_answer').notNull(), 
});

export const examRelations=relations(exams, ({many})=>({
    sections:many(examSections),
}));

export const examSectionsRelation=relations(examSections, ({one, many})=>({
    exam:one(exams,{
        fields:[examSections.examId],
        references:[exams.id]
    }),
    questions:many(questions)
}));

export const questionRelations=relations(questions, ({one})=>({
    section:one(examSections, {
        fields:[questions.sectionId],
        references:[examSections.id],
    })
}));
