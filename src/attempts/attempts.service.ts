import { Injectable, NotFoundException } from '@nestjs/common';
import { AttemptsRepo } from './attempts.repository';
import { ExamsService } from 'src/exams/exams.service';
import { attemptCreateDto, AttemptUpdateDto } from './dto/attempts.dto';
import { AiService } from 'src/ai/ai.service';

type AttemptScores = {
    listening?:number;
    reading?:number;
    writing?:{
        band:number;
        taskResponse: number;
        coherence: number;
        lexical: number;
        grammar: number;
        feedback: string;
    };
    overall?:number;
};

@Injectable()
export class AttemptsService {
    constructor(
        private readonly attemptRepo:AttemptsRepo, 
        private readonly examService:ExamsService, 
        private readonly aiService:AiService
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
        //get correct answers
        const [listeningCorrect, readingCorrect]=await Promise.all([
            this.examService.getCorrectAnswers({examId:updatedAttempt.examId, sectionType:'LISTENING'}),
            this.examService.getCorrectAnswers({examId:updatedAttempt.examId, sectionType:'READING'}),
        ]);
        const answers=updatedAttempt.answers ?? [];
        const listeningAnswers=answers.filter((answer)=>answer.typeOfSection==='LISTENING');
        const readingAnswers=answers.filter((answer)=>answer.typeOfSection==='READING');
        const writingAnswers=answers.filter((answer)=>answer.typeOfSection==='WRITING');

        const scores:AttemptScores={}

        if(listeningCorrect.size>0 || listeningAnswers.length>0){
            const listeningRawScore=this.calculateRawScore(listeningAnswers, listeningCorrect);
            scores.listening=this.convertRawToBand(listeningRawScore);
        }
        if(readingCorrect.size>0 || readingAnswers.length>0){
            const readingRawScore=this.calculateRawScore(readingAnswers, readingCorrect);
            scores.reading=this.convertRawToBand(readingRawScore);
        }

        if(writingAnswers.length>0){
            const combinedText = writingAnswers.map((a) => a.answerText).join('\n\n');
            const id: number = writingAnswers[0]?.questionId;
            const topic = await this.examService.getWritingTopic(id);
            if (!topic) {
                throw new NotFoundException(`Question ${id} not found`);
            }
            const { type, text } = topic;
            const writingScore=await this.aiService.analyzeText(combinedText,type,text!);
            scores.writing=writingScore;
        }

        await this.attemptRepo.updateScores(attemptId, scores);
        return { success: true, scores };
    }

    private normalizeAnswer(answerText:string){
        return answerText.trim().replace(/\s+/g,' ').toLowerCase();
    }

    private calculateRawScore(
        answers:AttemptUpdateDto['answers'],
        correctAnswersMap:Map<number,{correctAnswer:string}>
        ){
        let rawScore=0;
        for(const answer of answers){
            const correct=correctAnswersMap.get(answer.questionId);
            if(!correct){
                continue;
            }
            if(this.normalizeAnswer(answer.answerText)===this.normalizeAnswer(correct.correctAnswer)){
                rawScore+=1;
            }
        }
        return rawScore;
    }

    private convertRawToBand(rawScore:number){
        const scoreTable:{min:number; band:number}[]=[
            {min:39, band:9.0},
            {min:37, band:8.5},
            {min:35, band:8.0},
            {min:32, band:7.5},
            {min:30, band:7.0},
            {min:26, band:6.5},
            {min:23, band:6.0},
            {min:18, band:5.5},
            {min:16, band:5.0},
            {min:13, band:4.5},
            {min:10, band:4.0},
            {min:8, band:3.5},
            {min:6, band:3.0},
            {min:4, band:2.5},
            {min:2, band:2.0},
            {min:1, band:1.0},
            {min:0, band:1.0},
        ];
        for(const step of scoreTable){
            if(rawScore>=step.min){
                return step.band;
            }
        }
        return 1.0;
    }

    async getAttemptsByUserId(userId:number){
        return await this.attemptRepo.getAttemptsByUserId(userId);
    }

}
