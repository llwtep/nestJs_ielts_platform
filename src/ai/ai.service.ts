import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import pRetry from 'p-retry';

@Injectable()
export class AiService {
    private client: OpenRouter;
    private readonly logger=new Logger(AiService.name);

    private readonly models:string[];

    //список моделей задаётся через AI_MODELS, иначе дефолт ниже
    private static readonly DEFAULT_MODELS=[
        'nvidia/nemotron-3.5-lightning:free',
        'minimax/minimax-m3:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
    ];

    private static readonly REQUEST_TIMEOUT_MS=45_000;

    //без этих полей ответ бесполезен - считаем такой ответ провалом модели
    private static readonly REQUIRED_CRITERIA=['taskResponse','coherence','lexical','grammar'] as const;

    //IELTS не ставит ниже 1 и выше 9: всё за пределами - сломанный ответ модели, а не низкий балл
    private static isValidBand(value:unknown){
        const n=Number(value);
        return Number.isFinite(n) && n>=1 && n<=9;
    }

    constructor(private configService:ConfigService){
        const configured=this.configService.get<string>('AI_MODELS');
        this.models=configured
            ? configured.split(',').map((m)=>m.trim()).filter(Boolean)
            : AiService.DEFAULT_MODELS;
        this.client=new OpenRouter({
            apiKey:this.configService.get<string>('OPENROUTER_API_KEY'),
            //дамп каждого ответа в консоль только по требованию
            debugLogger:this.configService.get<string>('AI_DEBUG')==='true' ? console : undefined,
        });
    }
    async analyzeText(text:string, type:string,qtext:string){
        const prompt = `
                You are an expert IELTS Writing examiner.

                Evaluate the student's essay using IELTS criteria.
                WRITING TASK:
                type:${type}
                Task:${qtext}
                Return ONLY valid JSON.

                Schema:
                {
                "band": number,
                "taskResponse": number,
                "coherence": number,
                "lexical": number,
                "grammar": number,
                "feedback": "string"
                }

                Rules:
                - No markdown
                - No explanations
                - No text before or after JSON
                - Scores from 1.0 to 9.0 with 0.5 steps
                - feedback must be in English
                - feedback max 500 characters
                - final band is average of criteria rounded to nearest 0.5
                `;


        for (const model of this.models){
            try{
                this.logger.log(`Attempting request with model: ${model}`);

                const result=await pRetry(
                            ()=>this.withTimeout(this.executeRequest(model,prompt,text)),
                            {retries:2,minTimeout:1000}
                );
                this.logger.log(`Model ${model} returned a usable score`);
                return result;
            }catch(error:any){
                this.logger.error(`Model ${model} failed: ${error.message}`);
                continue;
            }
        }
            throw new HttpException(
                'AI service is temporarily overloaded. Please try again later.',
                HttpStatus.SERVICE_UNAVAILABLE
            );
        
        
    }

    private withTimeout<T>(request:Promise<T>):Promise<T>{
        return Promise.race([
            request,
            new Promise<never>((_,reject)=>
                setTimeout(()=>reject(new Error('AI request timed out')), AiService.REQUEST_TIMEOUT_MS),
            ),
        ]);
    }

    private async executeRequest(model:string,systemPrompt:string,userText:string){
        const completion=await this.client.chat.send({
            chatRequest:{
                model:model,
                responseFormat:{
                    type:"json_object"
                },
                //иначе reasoning-модели тратят весь бюджет на размышления и отдают пустой content
                reasoning:{ effort:'none' },
                messages:[
                    {
                        role:'system',
                        content:systemPrompt,
                    },
                    {
                        role:'user',
                        content:userText,
                    }
                ],
                temperature:0.1,
            }
        });
        const content = completion.choices[0].message.content;
        if(!content){
            throw new Error('Empty responce from AI');
        }
        const cleanJson=content.replace(/```json|```/g, '').trim();

        let parsed:any;
        try{
            parsed=JSON.parse(cleanJson);
        }catch{
            throw new Error(`Invalid JSON from ${model}: ${cleanJson.slice(0,300)}`);
        }

        //проверяем форму здесь, а не у вызывающего - иначе кривой ответ не даст перейти к следующей модели
        const bad=AiService.REQUIRED_CRITERIA.filter(
            (key)=>!AiService.isValidBand(parsed?.[key]),
        );
        if(bad.length>0){
            throw new Error(
                `Model ${model} gave no usable [${bad.join(', ')}], returned: ${cleanJson.slice(0,300)}`,
            );
        }
        return parsed;
    }



}
