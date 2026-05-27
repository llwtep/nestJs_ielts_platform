import { Inject, Injectable } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from 'src/exams/schema'
import { eq } from "drizzle-orm";

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


}