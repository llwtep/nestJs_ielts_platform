  import { IsString, IsEnum, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty } from '@nestjs/swagger';

  export class CreateQuestionDto {
    @ApiProperty({example:1})
    @IsNumber()
    questionNumber!: number;
    @ApiProperty({example:"Multiple choice"})
    @IsString()
    type!: string;
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
    @ApiProperty({ 
    enum: ['LISTENING', 'READING', 'WRITING'],
    example: 'LISTENING' 
  })
    @IsEnum(['LISTENING', 'READING', 'WRITING'])
    type!: 'LISTENING' | 'READING' | 'WRITING';
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
    @ApiProperty({ enum: ['ACADEMIC', 'GENERAL'], example: 'ACADEMIC', required: false })
    @IsOptional()
    @IsEnum(['ACADEMIC', 'GENERAL'])
    type?: 'ACADEMIC' | 'GENERAL';
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