import { Body, Controller, Get, Param, ParseIntPipe, Post, UseFilters } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateFullExamDto } from './dto/create-exam.dto';
import { ApiParam } from '@nestjs/swagger';
import { DomainExceptionFilter } from './exceptions/domain-exceptions';

@Controller('exams')
@UseFilters(DomainExceptionFilter)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}
  @Post('create-full')
    async createFullExam(@Body() createExamDto:CreateFullExamDto){
      return await this.examsService.createFullExam(createExamDto);
    }
  @Get(':id')
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  async getFullExam(@Param('id', ParseIntPipe) id:number){ 
    return await this.examsService.getFullExam(id); 
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @Get('reading/:id')
  async getReadingById(@Param('id', ParseIntPipe) id:number){
    return await this.examsService.getReadingById(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @Get('listening/:id')
  async getListeningById(@Param('id', ParseIntPipe) id:number){
    return await this.examsService.getListeningById(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @Get('writing/:id')
  async getWritingById(@Param('id', ParseIntPipe) id:number){
    return await this.examsService.getWritingById(id);
  }
}
