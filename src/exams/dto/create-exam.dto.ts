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
    @ApiProperty({example:"correct answer"})
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
    @ApiProperty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSectionDto)
    sections!: CreateSectionDto[];
  }