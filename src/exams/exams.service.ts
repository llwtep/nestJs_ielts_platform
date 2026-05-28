import { Injectable } from '@nestjs/common';
import { ExamRepository } from './exams.repository';
import { CreateFullExamDto } from './dto/create-exam.dto';
import { GetAnswerDto } from './dto/get-answer.dto';

@Injectable()
export class ExamsService {
    constructor(private readonly examRepo:ExamRepository){}
    async getFullExam(id:number){
        return await this.examRepo.getFullExam(id);
    }
    async createFullExam(dto:CreateFullExamDto){
        return await this.examRepo.createCompleteExam(dto);
    }
    async getReadingById(examId:number){
        return await this.examRepo.getExamSectionByID("READING", examId);
    }
    async getWritingById(examId:number){
        return await this.examRepo.getExamSectionByID("WRITING", examId);
    }
    async getListeningById(examId:number){
        return await this.examRepo.getExamSectionByID("LISTENING", examId);
    }
    async getCorrectAnswers({examId,sectionType}:GetAnswerDto){
        return await this.examRepo.getCorrectAnswers(examId,sectionType)
    }
}
