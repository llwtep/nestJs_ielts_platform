import { Body, Controller, Get, Param, Post, UseFilters, UseInterceptors } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateFullExamDto } from './dto/create-exam.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DomainExceptionFilter } from './exceptions/domain-exceptions';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('exams')
@UseFilters(DomainExceptionFilter)
@UseInterceptors(CacheInterceptor)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}
  @Post('create-full')
  @ApiBearerAuth()
    async createFullExam(@Body() createExamDto:CreateFullExamDto){
      return await this.examsService.createFullExam(createExamDto);
    }
  @Get(':id')
  @ApiBearerAuth()
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  async getFullExam(@Param('id') id:string){
    return await this.examsService.getFullExam(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @ApiBearerAuth()
  @Get('reading/:id')
  async getReadingById(@Param('id') id:string){
    return await this.examsService.getReadingById(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @ApiBearerAuth()
  @Get('listening/:id')
  async getListeningById(@Param('id') id:string){
    return await this.examsService.getListeningById(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @ApiBearerAuth()
  @Get('writing/:id')
  async getWritingById(@Param('id') id:string){
    return await this.examsService.getWritingById(id);
  }
}
