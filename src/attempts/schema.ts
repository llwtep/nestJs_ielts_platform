import { relations } from "drizzle-orm";
import { pgTable, serial, integer,text, jsonb, timestamp, boolean, uniqueIndex} from "drizzle-orm/pg-core";
import { exams, questions } from "src/exams/schema";
import { users } from "src/users/schema";

export const attempts=pgTable('attempts',{
    id:serial('id').primaryKey(),
    userId:integer('user_id').references(()=>users.id, {onDelete:'cascade'}).notNull(),
    examId:integer('exam_id').references(()=>exams.id,{onDelete:'cascade'}).notNull(),
    status:text('status').default('IN_PROGRESS'),
    scores:jsonb('scores').$type<{
        listening?:number;
        reading?:number;
        writing?:{
            band:number;
            taskResponse: number;
            coherence: number;
            lexical: number;
            grammar: number;
            feedback: string;
        };
        overall?:number
    }>(),
    createdAt:timestamp('created_at').defaultNow().notNull(),
    finishedAt:timestamp('finished_at'),
});


export const userAnswers=pgTable('user_answers',{
    id:serial('id').primaryKey(),
    attemptId:integer('attempt_id').references(()=>attempts.id, {onDelete:'cascade'}).notNull(),
    questionId:integer('question_id').references(()=>questions.id, {onDelete:'cascade'}).notNull(),
    typeOfSection:text('type_of_section').notNull(),    
    answerText:text('answer_text').notNull(),
    isCorrect:boolean('is_correct'),
},  (table)=>({
    attemptQuestionIdx:uniqueIndex('attempt_question_idx').on(table.attemptId, table.questionId),
}));



// relations
export const attemptsRelations=relations(attempts, ({one,many})=>({
    user:one(users,{
        fields:[attempts.userId],
        references:[users.id]
    }),
    exam:one(exams,{
        fields:[attempts.examId],
        references:[exams.id]
    }),
    answers:many(userAnswers),
}));

export const userAnswersRelations=relations(userAnswers,({one})=>({
    attempts:one(attempts,{
        fields:[userAnswers.attemptId],
        references:[attempts.id]
    }),
    questions:one(questions,{
        fields:[userAnswers.questionId],
        references:[questions.id]
    })
}));