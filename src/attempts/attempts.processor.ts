import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Job } from "bullmq";
import { AttemptsRepo } from './attempts.repository';
import { ExamsService } from 'src/exams/exams.service';
import { AiService } from "src/ai/ai.service";

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

@Processor('exam-checking')
@Injectable()
export class AttemptProcessor extends WorkerHost{
    constructor(
    private readonly examService: ExamsService, 
    private readonly aiService: AiService,
    private readonly attemptRepo: AttemptsRepo,
  ) {
    super();
  }
    private readonly logger=new Logger(AttemptProcessor.name);

    async process(job: Job<any, any, string>): Promise<any> {
        if(job.name!=='analyze-scores') return;
        const {attemptId}=job.data;
        //ответы берём из БД, а не из тела запроса: там лежит всё, включая автосохранения
        const attempt=await this.attemptRepo.getAttemptWithAnswers(attemptId);
        if(!attempt){
            throw new NotFoundException(`Attempt ${attemptId} not found`);
        }
        await this.attemptRepo.setStatus(attemptId,'SCORING');

        const [listeningCorrect, readingCorrect]=await Promise.all([
            this.examService.getCorrectAnswers({examId:attempt.examId, sectionType:'LISTENING'}),
            this.examService.getCorrectAnswers({examId:attempt.examId, sectionType:'READING'}),
        ]);
        const answers=attempt.answers ?? [];
        const listeningAnswers=answers.filter((answer)=>answer.typeOfSection==='LISTENING');
        const readingAnswers=answers.filter((answer)=>answer.typeOfSection==='READING');
        const writingAnswers=answers.filter((answer)=>answer.typeOfSection==='WRITING');
        const scores:AttemptScores={}
        //секции нет в экзамене - не выставляем за неё балл
        if(listeningCorrect.size>0){
            const listeningRawScore=this.calculateRawScore(listeningAnswers, listeningCorrect);
            scores.listening=this.convertRawToBand(listeningRawScore);
        }
        if(readingCorrect.size>0){
            const readingRawScore=this.calculateRawScore(readingAnswers, readingCorrect);
            scores.reading=this.convertRawToBand(readingRawScore);
        }
        if(writingAnswers.length>0){
            const combinedText = writingAnswers.map((a) => a.answerText).join('\n\n');
            const id: number = writingAnswers[0].questionId;
            const topic = await this.examService.getWritingTopic(id);
            if (!topic) {
                throw new NotFoundException(`Question ${id} not found`);
            }
            const { type, text } = topic;

            const writingScore=await this.aiService.analyzeText(combinedText,type,text!);
            scores.writing=writingScore;
        }
        await this.attemptRepo.updateScores(attemptId, scores, 'SCORED');
        return { success: true, scores };
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job){
        //ретраи ещё остались - попытка вернётся в очередь
        if(job.attemptsMade < (job.opts.attempts ?? 1)) return;
        this.logger.error(`Scoring failed for attempt ${job.data?.attemptId}: ${job.failedReason}`);
        if(job.data?.attemptId){
            await this.attemptRepo.setStatus(job.data.attemptId,'SCORING_FAILED');
        }
    }

    private normalizeAnswer(answerText:string){
        return answerText.trim().replace(/\s+/g,' ').toLowerCase();
    }

    private calculateRawScore(
        answers:{questionId:number; answerText:string}[],
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
}