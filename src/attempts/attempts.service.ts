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
        const exam=await this.examService.getExamMeta(attempt.examId);
        if(!exam){
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
            expiresAt: new Date(Date.now() + exam.durationMinutes * 60_000),
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

    private isExpired(attempt:{expiresAt:Date|null}){
        return !!attempt.expiresAt && attempt.expiresAt.getTime() < Date.now();
    }

    //закрывает попытку и ставит её в очередь на проверку
    private async submitForScoring(attemptId:string, answers:AttemptUpdateDto['answers']){
        await this.attemptRepo.update(attemptId,{
            status:'COMPLETED',
            answers:answers ?? [],
        });
        //jobId привязан к попытке - дубль в очередь не попадёт
        await this.examQueue.add('analyze-scores',
            { attemptId },
            {
                jobId:attemptId,
                attempts:3,
                backoff:5000,
                //без этого история джоб копится в Redis бесконечно
                removeOnComplete:{age:24*3600, count:200},
                removeOnFail:{age:7*24*3600},
            });
    }

    async updateAttempt(attemptId:string, userId:string, updatedAttempt:AttemptUpdateDto){
        const attempt=await this.getOwnAttempt(attemptId,userId);
        if(attempt.status!=='IN_PROGRESS'){
            throw new BadRequestException('Attempt is already submitted');
        }
        //время вышло - принимать новые ответы уже нельзя, сдаём что есть
        if(this.isExpired(attempt)){
            await this.submitForScoring(attemptId, []);
            throw new BadRequestException('Attempt time is over, it was submitted automatically');
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
        //после дедлайна оцениваем только то, что успело сохраниться
        await this.submitForScoring(attemptId, this.isExpired(attempt) ? [] : updatedAttempt.answers);
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
