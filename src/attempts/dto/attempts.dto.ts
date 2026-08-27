import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";


export class attemptCreateDto{
    @ApiProperty()
    @IsUUID()
    examId!:string;
}

export class UserAnswerDto {
  @ApiProperty({ example: 12, description: 'ID вопроса' })
  @IsInt()
  questionId!: number;
  @ApiProperty({ enum: ['LISTENING', 'READING', 'WRITING'], example: 'LISTENING' })
  @IsEnum(['LISTENING', 'READING', 'WRITING'])
  typeOfSection!: 'LISTENING' | 'READING' | 'WRITING';
  @ApiProperty({ example: 'Shared apartment', description: 'Текст ответа пользователя' })
  @IsString()
  answerText!: string;
}


export class AttemptUpdateDto {
  @ApiProperty({ type: [UserAnswerDto], description: 'Массив ответов пользователя' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) 
  @Type(() => UserAnswerDto)      
  answers?: UserAnswerDto[] = [];
}
