import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job, UnrecoverableError } from "bullmq";
import { AttemptsRepo } from './attempts.repository';
import { ExamsService } from 'src/exams/exams.service';
import { AiService } from "src/ai/ai.service";
import {
    AttemptScores,
    ExamType,
    isAnswerCorrect,
    overallBand,
    parseWritingScore,
    rawToBand,
    WritingTaskScore,
    writingBand,
} from "./scoring";

@Processor('exam-checking')
@Injectable()
export class AttemptProcessor extends WorkerHost{
    private readonly logger=new Logger(AttemptProcessor.name);

    constructor(
    private readonly examService: ExamsService, 
    private readonly aiService: AiService,
    private readonly attemptRepo: AttemptsRepo,
  ) {
    super();
  }

    async process(job: Job<any, any, string>): Promise<any> {
        if(job.name!=='analyze-scores') return;
        const {attemptId}=job.data;
        //ответы берём из БД, а не из тела запроса: там лежит всё, включая автосохранения
        const attempt=await this.attemptRepo.getAttemptWithAnswers(attemptId);
        if(!attempt){
            //попытку удалили - ретраить нечего, сразу в failed
            throw new UnrecoverableError(`Attempt ${attemptId} not found`);
        }
        await this.attemptRepo.setStatus(attemptId,'SCORING');

        const sections=await this.examService.getAnswerKey(attempt.examId);
        const examType:ExamType=attempt.exam?.type==='GENERAL' ? 'GENERAL' : 'ACADEMIC';

        //questionId -> вопрос вместе с его секцией
        const answerKey=new Map<number,{
            sectionType:string;
            partNumber:number;
            questionType:string;
            text:string|null;
            correctAnswer:string;
        }>();
        const total={LISTENING:0, READING:0};
        for(const section of sections){
            for(const question of section.questions){
                answerKey.set(question.id,{
                    sectionType:section.type,
                    partNumber:section.partNumber,
                    questionType:question.type,
                    text:question.text,
                    correctAnswer:question.correctAnswer,
                });
                if(section.type==='LISTENING'||section.type==='READING'){
                    total[section.type]++;
                }
            }
        }

        const verdicts=new Map<number, boolean>();
        const raw={LISTENING:0, READING:0};
        const writingTasks:{task:number; questionType:string; topic:string; text:string}[]=[];

        for(const answer of attempt.answers){
            const question=answerKey.get(answer.questionId);
            //ответ на вопрос не из этого экзамена - игнорируем
            if(!question) continue;
            if(question.sectionType==='WRITING'){
                writingTasks.push({
                    task:question.partNumber,
                    questionType:question.questionType,
                    topic:question.text ?? '',
                    text:answer.answerText,
                });
                continue;
            }
            if(question.sectionType!=='LISTENING' && question.sectionType!=='READING') continue;
            const correct=isAnswerCorrect(answer.answerText, question.correctAnswer);
            verdicts.set(answer.questionId, correct);
            if(correct) raw[question.sectionType]++;
        }

        const scores:AttemptScores={};
        //секции нет в экзамене - не выставляем за неё балл
        if(total.LISTENING>0) scores.listening=rawToBand(raw.LISTENING,total.LISTENING,'LISTENING',examType);
        if(total.READING>0) scores.reading=rawToBand(raw.READING,total.READING,'READING',examType);

        if(writingTasks.length>0){
            //Task 1 и Task 2 - разные задания, каждое оценивается отдельно
            const graded:WritingTaskScore[]=[];
            for(const task of writingTasks.sort((a,b)=>a.task-b.task)){
                const result=await this.aiService.analyzeText(task.text, task.questionType, task.topic);
                graded.push(parseWritingScore(result, task.task));
            }
            const band=writingBand(graded);
            if(band!==undefined) scores.writing={band, tasks:graded};
        }

        const modules=[scores.listening, scores.reading, scores.writing?.band]
            .filter((b): b is number => b!==undefined);
        scores.overall=overallBand(modules);

        await this.attemptRepo.markAnswers(attemptId, verdicts);
        await this.attemptRepo.updateScores(attemptId, scores, 'SCORED');
        return { success: true, scores };
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job){
        //false, пока джоба уходит на очередной ретрай
        if(!(await job.isFailed())) return;
        this.logger.error(`Scoring failed for attempt ${job.data?.attemptId}: ${job.failedReason}`);
        if(job.data?.attemptId){
            await this.attemptRepo.setStatus(job.data.attemptId,'SCORING_FAILED');
        }
    }
}
