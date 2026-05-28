import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber } from "class-validator";

export class GetAnswerDto{
    @ApiProperty()
    @IsNumber()
    examId:number=0;
    @ApiProperty({enum:['LISTENING', 'READING']})
    @IsEnum(['LISTENING', 'READING'])
    sectionType!:'LISTENING'| 'READING';
}