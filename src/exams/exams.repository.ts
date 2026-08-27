import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from 'src/exams/schema'
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

@Injectable()
export class ExamRepository{
    constructor(@Inject(DATABASE_CONNECTION) private readonly database:NodePgDatabase<typeof schema>){}

    async listExams(){
        return await this.database.query.exams.findMany({
            orderBy:(e,{asc})=>[asc(e.title)],
        });
    }

    async getFullExam(examId:string){
        return await this.database.query.exams.findFirst({
            where:eq(schema.exams.id, examId),
            with:{
                sections:{
                    orderBy:(s,{asc})=>[asc(s.partNumber)],
                    with:{
                        // correctAnswer наружу не отдаём
                        questions:{
                            columns:{correctAnswer:false},
                            orderBy:(q,{asc})=>[asc(q.questionNumber)],
                        }
                    },
                },
            },
        });
    };

    // без загрузки вопросов - для проверок существования экзамена
    async examExists(examId:string){
        const exam=await this.database.query.exams.findFirst({
            where:eq(schema.exams.id, examId),
            columns:{id:true},
        });
        return !!exam;
    }

    async getExamSectionByID(sectionType:'READING' | 'LISTENING' | 'WRITING', examId:string){
        return await this.database.query.exams.findFirst({
            where:eq(schema.exams.id, examId),
            with:{
                sections:{
                    where:eq(schema.examSections.type, sectionType),
                    orderBy:(s,{asc})=>[asc(s.partNumber)],
                    with:{
                        questions:{
                            columns:{correctAnswer:false},
                            orderBy:(q,{asc})=>[asc(q.questionNumber)],
                        }
                    }
                }
            }
        })
    }



    async createCompleteExam(data:{
        title:string,
        type?:string,
        sections:any[]
    }){
        return await this.database.transaction(async (tx)=>{
            const [newExam]=await tx.insert(schema.exams).values({
                id:randomUUID(),
                title:data.title,
                type:data.type ?? 'ACADEMIC',
            }).returning()

            for (const section of data.sections){
                const [newSection]=await tx.insert(schema.examSections).values(
                    {
                        id:randomUUID(),
                        examId:newExam.id,
                        type:section.type,
                        partNumber:section.partNumber,
                        content:section.content,
                        contentUrl:section.contentUrl

                    }
                ).returning();
                
                if(section.questions && Array.isArray(section.questions) && section.questions.length > 0){
                    const questionToInsert = section.questions.map((q)=>({
                        sectionId:newSection.id,
                        questionNumber:q.questionNumber,
                        type:q.type,
                        text:q.text,
                        correctAnswer:q.correctAnswer,
                    }));
                    await tx.insert(schema.questions).values(questionToInsert);
                }
            }
            return newExam;
        });
    }
    // всё, что нужно для проверки попытки: тип секции берём отсюда, а не от клиента
    async getAnswerKey(examId:string){
        return await this.database.query.examSections.findMany({
            where:eq(schema.examSections.examId, examId),
            with:{
                questions:{
                    columns:{
                        id:true,
                        questionNumber:true,
                        type:true,
                        text:true,
                        correctAnswer:true,
                    }
                }
            }
        });
    }

}
