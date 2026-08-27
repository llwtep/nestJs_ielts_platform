import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateFullExamDto } from './dto/create-exam.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DomainExceptionFilter } from './exceptions/domain-exceptions';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { jwtGuard } from 'src/auth/guards/jwt.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('exams')
@UseGuards(jwtGuard)
@ApiBearerAuth()
@UseFilters(DomainExceptionFilter)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}
  @Get()
  async listExams(){
    return await this.examsService.listExams();
  }
  @Post('create-full')
  @UseGuards(AdminGuard)
    async createFullExam(@Body() createExamDto:CreateFullExamDto){
      return await this.examsService.createFullExam(createExamDto);
    }
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  async getFullExam(@Param('id', ParseUUIDPipe) id:string){
    return await this.examsService.getFullExam(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @UseInterceptors(CacheInterceptor)
  @Get('reading/:id')
  async getReadingById(@Param('id', ParseUUIDPipe) id:string){
    return await this.examsService.getReadingById(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @UseInterceptors(CacheInterceptor)
  @Get('listening/:id')
  async getListeningById(@Param('id', ParseUUIDPipe) id:string){
    return await this.examsService.getListeningById(id);
  }
  @ApiParam({
    name:'id',
    description:'Exam id'
  })
  @UseInterceptors(CacheInterceptor)
  @Get('writing/:id')
  async getWritingById(@Param('id', ParseUUIDPipe) id:string){
    return await this.examsService.getWritingById(id);
  }
}
