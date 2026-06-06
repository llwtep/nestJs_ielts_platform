import { Injectable, NotFoundException } from '@nestjs/common';
import { AttemptsRepo } from './attempts.repository';
import { ExamsService } from 'src/exams/exams.service';
import { attemptCreateDto, AttemptUpdateDto } from './dto/attempts.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';



@Injectable()
export class AttemptsService {
    constructor(
        @InjectQueue('exam-checking') private examQueue:Queue,
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

    async updateAttempt(attemptId:number,updatedAttempt:AttemptUpdateDto){
        const attempt=await this.attemptRepo.getAttempt(attemptId);
        if(!attempt){
            throw new NotFoundException(`Attempt with id ${attemptId} not found`);
        }
        return await this.attemptRepo.update(attemptId, updatedAttempt)
    }

    async finishAttempt(attemptId:number, updatedAttempt:AttemptUpdateDto){
        const attempt=await this.attemptRepo.getAttempt(attemptId);
        if(!attempt){
            throw new NotFoundException(`Attempt with id ${attemptId} not found`);
        }
        //update attempt
        updatedAttempt.status='COMPLETED';
        await this.attemptRepo.update(attemptId,updatedAttempt);
        //add task to worker
        await this.examQueue.add('analyze-scores',
            {
            attemptId,
            updatedAttempt,
            },
            {
                attempts:3,
                backoff:5000
            });
        return { success: true, message:"Exam submitted for checking" };
       
    }

    

    async getAttemptsByUserId(userId:number){
        return await this.attemptRepo.getAttemptsByUserId(userId);
    }

}
