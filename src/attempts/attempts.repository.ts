import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from 'src/attempts/schema';
import { and, eq, sql } from "drizzle-orm";


@Injectable()
export class AttemptsRepo{
    constructor(@Inject(DATABASE_CONNECTION) private readonly database:NodePgDatabase<typeof schema>){}
    //create attempt
    async create(attempt:typeof schema.attempts.$inferInsert){
        return await this.database.insert(schema.attempts).values(attempt).returning();
    }
    //update attempt
    async update(attemptId: number, data: { status: string; answers: any[] }) {
        return await this.database.transaction(async (tx) => {
            await tx.update(schema.attempts)
            .set({
                status: data.status,
                finishedAt: data.status === 'COMPLETED' ? new Date() : null,
            })
            .where(eq(schema.attempts.id, attemptId)).returning({ id: schema.attempts.id }); 
            if (data.answers && data.answers.length > 0) {
            const valuesToInsert = data.answers.map((answer) => ({
                attemptId: attemptId,
                questionId: answer.questionId,
                typeOfSection: answer.typeOfSection,
                answerText: answer.answerText,
                isCorrect: answer.isCorrect ?? null,
            }));
            await tx.insert(schema.userAnswers)
                .values(valuesToInsert)
                .onConflictDoUpdate({
                target: [schema.userAnswers.attemptId, schema.userAnswers.questionId],
                set: {
                    answerText: sql`excluded.answer_text`,
                    isCorrect: sql`excluded.is_correct`,
                },
                });
            }
            return { success: true };
        });
        };
    async updateScores(attemptId:number, scores: typeof schema.attempts.$inferInsert['scores']){
        await this.database.update(schema.attempts)
            .set({ scores })
            .where(eq(schema.attempts.id, attemptId));
        return { success: true };
    }
    //get attempt by id
    async getAttempt(attemptId:number){
        const condition=eq(schema.attempts.id, attemptId)
        return this.database.query.attempts.findFirst({
            where:condition
        })
    }
    //check attempt with exam id
    async IsInProgressAttempt(examId:number, userId:number){
        const condition = and(
            eq(schema.attempts.examId, examId),
            eq(schema.attempts.userId, userId),
            eq(schema.attempts.status, 'IN_PROGRESS') 
            );
        const examAttempt=await this.database.query.attempts.findFirst({
            where:condition
        });
        return examAttempt;
    }

   

}
