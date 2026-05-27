import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ExamRepository } from './exams.repository';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports:[DatabaseModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamRepository],
  exports:[ExamsService]
})
export class ExamsModule {}
