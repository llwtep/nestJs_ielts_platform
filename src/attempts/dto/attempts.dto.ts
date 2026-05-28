import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";


export class attemptCreateDto{
    @ApiProperty()
    @IsNumber()
    userId!:number;
    @ApiProperty()
    @IsNumber()
    examId!:number;
    @ApiProperty({ enum: ['IN_PROGRESS', 'COMPLETED'], example: 'IN_PROGRESS' })
    @IsEnum(['IN_PROGRESS', 'COMPLETED'])
    status!:string;
}

export class UserAnswerDto {
  @ApiProperty({ example: 12, description: 'ID вопроса' })
  @IsNumber()
  questionId!: number;
  @ApiProperty({ enum: ['LISTENING', 'READING', 'WRITING'], example: 'LISTENING' })
  @IsEnum(['LISTENING', 'READING', 'WRITING'])
  typeOfSection!: 'LISTENING' | 'READING' | 'WRITING';
  @ApiProperty({ example: 'Shared apartment', description: 'Текст ответа пользователя' })
  @IsString()
  answerText!: string;
  @ApiPropertyOptional({ example: true, description: 'Правильный ли ответ (если проверяется сразу)' })
  @IsOptional()
  isCorrect?: boolean;
}


export class AttemptUpdateDto {
  @ApiProperty()
  @IsNumber()
  examId!:number;
  @ApiProperty({ enum: ['IN_PROGRESS', 'COMPLETED'], example: 'COMPLETED' })
  @IsEnum(['IN_PROGRESS', 'COMPLETED'])
  status!: 'IN_PROGRESS' | 'COMPLETED';
  @ApiProperty({ type: [UserAnswerDto], description: 'Массив ответов пользователя' })
  @IsArray()
  @ValidateNested({ each: true }) 
  @Type(() => UserAnswerDto)      
  answers!: UserAnswerDto[];
}