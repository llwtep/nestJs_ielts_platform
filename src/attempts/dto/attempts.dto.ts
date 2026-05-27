import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber } from "class-validator";


export class attemptCreateDto{
    @ApiProperty()
    @IsNumber()
    userId!:number;
    @ApiProperty()
    @IsNumber()
    examId!:number;
    @ApiProperty()
    @IsEnum(['IN_PROGRESS', 'COMPLETED'])
    status!:string;
}