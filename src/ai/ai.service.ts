import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';
import { Exception } from 'bullmq';
import pRetry from 'p-retry';

@Injectable()
export class AiService {
    private client: OpenRouter;
    private readonly logger=new Logger(AiService.name);

    private readonly modelFallBackList=[
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'nvidia/nemotron-3.5-content-safety:free',
        'nvidia/nemotron-3-ultra-550b-a55b:free',
        'liquid/lfm-2.5-1.2b-thinking:free',
        'openai/gpt-oss-120b:free',
        'z-ai/glm-4.5-air:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free'
    ]


    constructor(private configService:ConfigService){
        this.client=new OpenRouter({
        apiKey:this.configService.get<string>('OPENROUTER_API_KEY'),
        debugLogger:console 
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


        for (const model of this.modelFallBackList){
            try{
                this.logger.log(`Attempting request with model: ${model}`);

                const result=await pRetry(
                            ()=>this.executeRequest(model,prompt,text),
                            {retries:2,minTimeout:1000}
                );
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

    private async executeRequest(model:string,systemPrompt:string,userText:string){
        const completion=await this.client.chat.send({
            chatRequest:{
                model:'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
                responseFormat:{
                    type:"json_object"
                },
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
        try{
            return JSON.parse(cleanJson as string);
        }catch(e){
            throw new Error('Invalid JSON received from AI');
        }   
    }



}
