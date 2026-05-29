import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from 'src/exams/schema'
import { and, eq } from "drizzle-orm";

@Injectable()
export class ExamRepository{
    constructor(@Inject(DATABASE_CONNECTION) private readonly database:NodePgDatabase<typeof schema>){}
    async getFullExam(examId:number){
        return await this.database.query.exams.findFirst({
            where:eq(schema.exams.id, examId),
            with:{
                sections:{
                    with:{
                        questions:true
                    },
                },
            },
        });
    };

    async getExamSectionByID(sectionType:'READING' | 'LISTENING' | 'WRITING', examId:number){
        return await this.database.query.exams.findFirst({
            where:eq(schema.exams.id, examId),
            with:{
                sections:{
                    where:eq(schema.examSections.type, sectionType),
                    with:{
                        questions:true
                    }
                }
            }
        })
    }



    async createCompleteExam(data:{
        title:string,
        sections:any[]
    }){
        return await this.database.transaction(async (tx)=>{
            const [newExam]=await tx.insert(schema.exams).values({title:data.title}).returning()

            for (const section of data.sections){
                const [newSection]=await tx.insert(schema.examSections).values(
                    {
                        examId:newExam.id,
                        type:section.type,
                        partNumber:section.partNumber,
                        content:section.content,
                        contentUrl:section.contentUrl

                    }
                ).returning();
                
                if(section.questions && Array.isArray(section.questions) && section.questions.length > 0){
                    const questionToInsert = section.questions.map((q)=>({
                        ...q,
                        sectionId:newSection.id
                    }));
                    await tx.insert(schema.questions).values(questionToInsert);
                }
            }
            return newExam;
        });
    }
    async getCorrectAnswers(examId:number, sectionType:'LISTENING'|'READING'){
        const sectionCondition=[eq(schema.examSections.examId, examId)];

        if(sectionType){
            sectionCondition.push(eq(schema.examSections.type,sectionType));
        }

        const sectionWithQuestions=await this.database.query.examSections.findMany({
            where:and(...sectionCondition),
            with:{
                questions:{
                    columns:{
                        id:true,
                        questionNumber:true,
                        correctAnswer:true,
                        type:true,
                    }
                }
            }
            
        });

        const correctAnswersMap=new Map<number,{
            correctAnswer:string;
            questionNumber:number;
            sectionType:string;
        }>();
        for(const section of sectionWithQuestions){
            for (const question of section.questions){
                correctAnswersMap.set(question.id,{
                    correctAnswer:question.correctAnswer,
                    questionNumber:question.questionNumber,
                    sectionType:section.type
                });
            }
        }
        return correctAnswersMap;
    }

    async getWritingTopic(questionId:number){
        const condition=eq(schema.questions.id,questionId);
        return await this.database.query.questions.findFirst({
            where:condition,
            columns:{
                type:true,
                text:true
            }
        })
    }

}