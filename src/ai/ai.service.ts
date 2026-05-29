import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouter } from '@openrouter/sdk';


@Injectable()
export class AiService {
    private client: OpenRouter;
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
        const completion=await this.client.chat.send({
            chatRequest:{
                model:'moonshotai/kimi-k2.6:free',
                responseFormat:{
                    type:"json_object"
                },
                messages:[
                    {
                        role:'system',
                        content:prompt,
                    },
                    {
                        role:'user',
                        content:text,
                    }
                ],
                temperature:0.1,
            }
           
        });
        const content = completion.choices[0].message.content;
        return JSON.parse(content as string);
    }



}
