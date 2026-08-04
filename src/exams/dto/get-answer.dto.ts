import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

export class GetAnswerDto{
    @ApiProperty()
    @IsString()
    examId:string="";
    @ApiProperty({enum:['LISTENING', 'READING']})
    @IsEnum(['LISTENING', 'READING'])
    sectionType!:'LISTENING'| 'READING';
}