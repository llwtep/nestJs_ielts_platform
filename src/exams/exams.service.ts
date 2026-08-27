import { BadRequestException, Injectable } from '@nestjs/common';
import { ExamRepository } from './exams.repository';
import { CreateFullExamDto } from './dto/create-exam.dto';
import { ExamNotFoundError } from './exceptions/domain-errors';
import { FIXED_OPTIONS, OPTION_BASED } from './constants';

@Injectable()
export class ExamsService {
    constructor(private readonly examRepo:ExamRepository){}
    async listExams(){
        return await this.examRepo.listExams();
    }
    async getExamMeta(examId:string){
        return await this.examRepo.getExamMeta(examId);
    }
    async getFullExam(id:string){
        const exam=await this.examRepo.getFullExam(id);
        if(!exam){
            throw new ExamNotFoundError(id);
        }
        return exam;
    }
    async createFullExam(dto:CreateFullExamDto){
        const seenSections=new Set<string>();
        for(const section of dto.sections){
            const sectionKey=`${section.type}:${section.partNumber}`;
            if(seenSections.has(sectionKey)){
                throw new BadRequestException(`Duplicate section ${sectionKey}`);
            }
            seenSections.add(sectionKey);

            const seenQuestions=new Set<number>();
            for(const question of section.questions ?? []){
                if(seenQuestions.has(question.questionNumber)){
                    throw new BadRequestException(`Duplicate question ${question.questionNumber} in ${sectionKey}`);
                }
                seenQuestions.add(question.questionNumber);

                //у TRUE/FALSE и YES/NO варианты всегда одни и те же
                if(!question.options?.length){
                    question.options=FIXED_OPTIONS[question.type];
                }
                if(OPTION_BASED.includes(question.type) && !question.options?.length){
                    throw new BadRequestException(
                        `Question ${question.questionNumber} of type ${question.type} requires options`,
                    );
                }
            }
        }
        return await this.examRepo.createCompleteExam(dto);
    }
    async getReadingById(examId:string){
        const exam=await this.examRepo.getExamSectionByID("READING", examId);
        if(!exam){
            throw new ExamNotFoundError(examId);
        }
        return exam
    }
    async getWritingById(examId:string){
        const exam= await this.examRepo.getExamSectionByID("WRITING", examId);
        if(!exam){
            throw new ExamNotFoundError(examId);
        }
        return exam;

    }
    async getListeningById(examId:string){
        const exam=await this.examRepo.getExamSectionByID("LISTENING", examId);
        if(!exam){
            throw new ExamNotFoundError(examId);
        }
        return exam;
    }
    async getAnswerKey(examId:string){
        return await this.examRepo.getAnswerKey(examId);
    }

}
