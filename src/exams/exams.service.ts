import { Injectable } from '@nestjs/common';
import { ExamRepository } from './exams.repository';
import { CreateFullExamDto } from './dto/create-exam.dto';
import { ExamNotFoundError } from './exceptions/domain-errors';

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
