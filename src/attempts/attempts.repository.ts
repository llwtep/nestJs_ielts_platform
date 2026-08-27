import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as attemptsSchema from 'src/attempts/schema';
import * as examSchema from 'src/exams/schema';
import * as userSchema from 'src/users/schema';
import { and, eq, sql } from "drizzle-orm";

const schema = { ...attemptsSchema, ...examSchema, ...userSchema };

@Injectable()
export class AttemptsRepo{
    constructor(@Inject(DATABASE_CONNECTION) private readonly database:NodePgDatabase<typeof schema>){}
    //create attempt
    async create(attempt:typeof schema.attempts.$inferInsert){
        return await this.database.insert(schema.attempts).values(attempt).returning();
    }
    //update attempt
    async update(attemptId: string, data: { status: string; answers: any[] }) {
        return await this.database.transaction(async (tx) => {
            await tx.update(schema.attempts)
            .set({
                status: data.status,
                ...(data.status === 'COMPLETED' ? { finishedAt: new Date() } : {}),
            })
            .where(eq(schema.attempts.id, attemptId));
            if (data.answers && data.answers.length > 0) {
            const valuesToInsert = data.answers.map((answer) => ({
                attemptId: attemptId,
                questionId: answer.questionId,
                typeOfSection: answer.typeOfSection,
                answerText: answer.answerText,
            }));
            await tx.insert(schema.userAnswers)
                .values(valuesToInsert)
                .onConflictDoUpdate({
                target: [schema.userAnswers.attemptId, schema.userAnswers.questionId],
                set: {
                    answerText: sql`excluded.answer_text`,
                    typeOfSection: sql`excluded.type_of_section`,
                },
                });
            }
            return { success: true };
        });
        };
    async setStatus(attemptId:string, status:string){
        await this.database.update(schema.attempts)
            .set({ status })
            .where(eq(schema.attempts.id, attemptId));
    }
    async updateScores(attemptId:string, scores: typeof schema.attempts.$inferInsert['scores'], status:string){
        await this.database.update(schema.attempts)
            .set({ scores, status })
            .where(eq(schema.attempts.id, attemptId));
        return { success: true };
    }
    // проставляет isCorrect по результатам проверки
    async markAnswers(attemptId:string, verdicts:Map<number, boolean>){
        if(verdicts.size===0) return;
        await this.database.transaction(async (tx)=>{
            for(const [questionId,isCorrect] of verdicts){
                await tx.update(schema.userAnswers)
                    .set({ isCorrect })
                    .where(and(
                        eq(schema.userAnswers.attemptId, attemptId),
                        eq(schema.userAnswers.questionId, questionId),
                    ));
            }
        });
    }
    //get attempt by id
    async getAttempt(attemptId:string){
        const condition=eq(schema.attempts.id, attemptId)
        return this.database.query.attempts.findFirst({
            where:condition
        })
    }
    // попытка со всеми ответами - источник истины для проверки
    async getAttemptWithAnswers(attemptId:string){
        return await this.database.query.attempts.findFirst({
            where:eq(schema.attempts.id, attemptId),
            with:{
                exam:{ columns:{ id:true, title:true, type:true } },
                answers:{
                    columns:{ questionId:true, typeOfSection:true, answerText:true, isCorrect:true },
                },
            },
        });
    }
    //check attempt with exam id
    async IsInProgressAttempt(examId:string, userId:string){
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

    async getAttemptsByUserId(userId:string){
        const condition=eq(schema.attempts.userId,userId);
        const attempts=await this.database.query.attempts.findMany({
            where:condition,
            orderBy:(a,{desc})=>[desc(a.createdAt)],
            with:{
                exam:{ columns:{ id:true, title:true, type:true } },
            },
        });
        return attempts;
    }

   

}
