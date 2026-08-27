  import { IsString, IsEnum, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty } from '@nestjs/swagger';
  import { EXAM_TYPES, QUESTION_TYPES, SECTION_TYPES } from '../constants';
  import type { ExamKind, QuestionKind, SectionKind } from '../constants';

  export class CreateQuestionDto {
    @ApiProperty({example:1})
    @IsNumber()
    questionNumber!: number;
    @ApiProperty({enum: QUESTION_TYPES, example: 'MCQ'})
    @IsEnum(QUESTION_TYPES)
    type!: QuestionKind;
    @ApiProperty({example:"Question"})
    @IsOptional()
    @IsString()
    text?: string;
    @ApiProperty({example:["A","B","C"], required:false, description:'варианты для multiple choice'})
    @IsOptional()
    @IsArray()
    @IsString({each:true})
    options?: string[];
    @ApiProperty({example:"correct answer", description:'несколько допустимых вариантов через |'})
    @IsString()
    correctAnswer!: string;
  }


  export class CreateSectionDto {
    @ApiProperty({ enum: SECTION_TYPES, example: 'LISTENING' })
    @IsEnum(SECTION_TYPES)
    type!: SectionKind;
    @ApiProperty()
    @IsNumber()
    partNumber!: number;
    @ApiProperty({required:false})
    @IsOptional()
    @IsString()
    title?: string;
    @ApiProperty()
    @IsOptional()
    @IsString()
    content?: string;
    @ApiProperty()
    @IsOptional()
    @IsString()
    contentUrl?: string;
    @ApiProperty()
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions?: CreateQuestionDto[]=[];
  }


  export class CreateFullExamDto {
    @ApiProperty()
    @IsString()
    title!: string;
    @ApiProperty({ enum: EXAM_TYPES, example: 'ACADEMIC', required: false })
    @IsOptional()
    @IsEnum(EXAM_TYPES)
    type?: ExamKind;
    @ApiProperty({ example: 165, required: false, description: 'длительность попытки в минутах' })
    @IsOptional()
    @IsNumber()
    durationMinutes?: number;
    @ApiProperty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSectionDto)
    sections!: CreateSectionDto[];
  }