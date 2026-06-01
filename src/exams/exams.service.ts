import { Injectable } from '@nestjs/common';
import { ExamRepository } from './exams.repository';
import { CreateFullExamDto } from './dto/create-exam.dto';
import { GetAnswerDto } from './dto/get-answer.dto';
import { ExamNotFoundError } from './exceptions/domain-errors';

@Injectable()
export class ExamsService {
    constructor(private readonly examRepo:ExamRepository){}
    async getFullExam(id:number){
        const exam=await this.examRepo.getFullExam(id);
        if(!exam){
            throw new ExamNotFoundError(id);
        }
        return exam;
    }
    async createFullExam(dto:CreateFullExamDto){
        return await this.examRepo.createCompleteExam(dto);
    }
    async getReadingById(examId:number){
        const exam=await this.examRepo.getExamSectionByID("READING", examId);
        if(!exam){
            throw new ExamNotFoundError(examId);
        }
        return exam
    }
    async getWritingById(examId:number){
        const exam= await this.examRepo.getExamSectionByID("WRITING", examId);
        if(!exam){
            throw new ExamNotFoundError(examId);
        }
        return exam;

    }
    async getListeningById(examId:number){
        const exam=await this.examRepo.getExamSectionByID("LISTENING", examId);
        if(!exam){
            throw new ExamNotFoundError(examId);
        }
        return exam;
    }
    async getCorrectAnswers({examId,sectionType}:GetAnswerDto){
        return await this.examRepo.getCorrectAnswers(examId,sectionType)
    }
    async getWritingTopic(questionId:number){
        return await this.examRepo.getWritingTopic(questionId)
    }
}
