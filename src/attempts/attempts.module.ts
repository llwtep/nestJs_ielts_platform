import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AttemptsRepo } from './attempts.repository';
import { ExamsModule } from 'src/exams/exams.module';
import { AiModule } from 'src/ai/ai.module';

@Module({
  imports:[DatabaseModule, ExamsModule, AiModule],
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsRepo],
})
export class AttemptsModule {}
