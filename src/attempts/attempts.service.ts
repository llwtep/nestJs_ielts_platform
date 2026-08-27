import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttemptsRepo } from './attempts.repository';
import { ExamsService } from 'src/exams/exams.service';
import { attemptCreateDto, AttemptUpdateDto } from './dto/attempts.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';



@Injectable()
export class AttemptsService {
    constructor(
        @InjectQueue('exam-checking') private examQueue:Queue,
        private readonly attemptRepo:AttemptsRepo, 
        private readonly examService:ExamsService
    ){}
    
    async startAttempt(userId:string, attempt:attemptCreateDto){
        //checking examID
        if(!await this.examService.examExists(attempt.examId)){
            throw new NotFoundException(`Exam with id ${attempt.examId} not found`);
        }
        //check if attempt already created with this exam for user
        const attemptOld=await this.attemptRepo.IsInProgressAttempt(attempt.examId,userId);
        if(attemptOld){
            return attemptOld;
        }
        const [created]=await this.attemptRepo.create({
            id: randomUUID(),
            userId,
            examId: attempt.examId,
            status: 'IN_PROGRESS',
        });
        return created;
    }

    // попытка должна существовать и принадлежать пользователю
    private async getOwnAttempt(attemptId:string, userId:string){
        const attempt=await this.attemptRepo.getAttempt(attemptId);
        if(!attempt){
            throw new NotFoundException(`Attempt with id ${attemptId} not found`);
        }
        if(attempt.userId!==userId){
            throw new ForbiddenException('This attempt belongs to another user');
        }
        return attempt;
    }

    async updateAttempt(attemptId:string, userId:string, updatedAttempt:AttemptUpdateDto){
        const attempt=await this.getOwnAttempt(attemptId,userId);
        if(attempt.status!=='IN_PROGRESS'){
            throw new BadRequestException('Attempt is already submitted');
        }
        return await this.attemptRepo.update(attemptId, {
            status:'IN_PROGRESS',
            answers:updatedAttempt.answers ?? [],
        });
    }

    async finishAttempt(attemptId:string, userId:string, updatedAttempt:AttemptUpdateDto){
        const attempt=await this.getOwnAttempt(attemptId,userId);
        if(attempt.status!=='IN_PROGRESS'){
            throw new BadRequestException('Attempt is already submitted');
        }
        //сохраняем последнюю пачку ответов и закрываем попытку
        await this.attemptRepo.update(attemptId,{
            status:'COMPLETED',
            answers:updatedAttempt.answers ?? [],
        });
        //add task to worker, jobId привязан к попытке - дубль в очередь не попадёт
        await this.examQueue.add('analyze-scores',
            { attemptId },
            {
                jobId:attemptId,
                attempts:3,
                backoff:5000
            });
        return { success: true, attemptId, status:'COMPLETED', message:"Exam submitted for checking" };
       
    }

    async getAttemptResult(attemptId:string, userId:string){
        const attempt=await this.attemptRepo.getAttemptWithAnswers(attemptId);
        if(!attempt){
            throw new NotFoundException(`Attempt with id ${attemptId} not found`);
        }
        if(attempt.userId!==userId){
            throw new ForbiddenException('This attempt belongs to another user');
        }
        return attempt;
    }

    async getAttemptsByUserId(userId:string){
        return await this.attemptRepo.getAttemptsByUserId(userId);
    }

}
