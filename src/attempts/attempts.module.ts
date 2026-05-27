import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AttemptsRepo } from './attempts.repository';
import { ExamsModule } from 'src/exams/exams.module';

@Module({
  imports:[DatabaseModule, ExamsModule],
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsRepo],
})
export class AttemptsModule {}
