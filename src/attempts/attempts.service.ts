import { Injectable, NotFoundException } from '@nestjs/common';
import { AttemptsRepo } from './attempts.repository';
import { ExamsService } from 'src/exams/exams.service';
import { attemptCreateDto } from './dto/attempts.dto';

@Injectable()
export class AttemptsService {
    constructor(
        private readonly attemptRepo:AttemptsRepo, 
        private readonly examService:ExamsService
    ){}
    
    async startAttempt(attempt:attemptCreateDto){
        //checking examID
        const exam=await this.examService.getFullExam(attempt.examId);
        if(!exam){
            throw new NotFoundException(`Exam with id ${attempt.examId} not found`);
        }
        //check if attempt already created with this exam for user
        const attemptOld=await this.attemptRepo.IsInProgressAttempt(attempt.examId,attempt.userId);
        if(attemptOld){
            return attemptOld;
        }else{
            return await this.attemptRepo.create(attempt);
        }



    }

}
