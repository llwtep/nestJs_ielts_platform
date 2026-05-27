import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateFullExamDto } from './dto/create-exam.dto';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}
  @Post('create-full')
    async createFullExam(@Body() createExamDto:CreateFullExamDto){
      return await this.examsService.createFullExam(createExamDto);
    }
  @Get(':id')
  async getFullExam(@Param('id', ParseIntPipe) id:number){ 
    return await this.examsService.getFullExam(id); 
  }
  @Get('reading/:id')
  async getReadingById(@Param('id', ParseIntPipe) id:number){
    return await this.examsService.getReadingById(id);
  }
  @Get('listening/:id')
  async getListeningById(@Param('id', ParseIntPipe) id:number){
    return await this.examsService.getListeningById(id);
  }
  @Get('writing/:id')
  async getWritingById(@Param('id', ParseIntPipe) id:number){
    return await this.examsService.getWritingById(id);
  }
}
