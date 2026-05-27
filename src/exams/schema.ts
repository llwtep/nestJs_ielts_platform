
import { relations } from "drizzle-orm";
import { serial, text, integer} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const exams=pgTable('exams',{
    id:serial('id').primaryKey(),
    type:text('type'),
    title:text('title')
})

export const examSections = pgTable('exam_sections', {
  id: serial('id').primaryKey(),
  examId: integer('exam_id').references(() => exams.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  partNumber: integer('part_number').notNull(), 
  title: text('title'), 
  content: text('content'), 
  contentUrl: text('content_url'), 
}); 

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  sectionId: integer('section_id').references(() => examSections.id, { onDelete: 'cascade' }).notNull(),
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
