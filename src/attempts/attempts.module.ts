import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AttemptsRepo } from './attempts.repository';
import { ExamsModule } from 'src/exams/exams.module';
import { AiModule } from 'src/ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { AttemptProcessor } from './attempts.processor';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports:[
    BullModule.forRoot({
          connection:{
            host:'127.0.0.1',
            port:6379,
          }
        }),
    BullModule.registerQueue({
      name:'exam-checking'
    }),
    BullBoardModule.forFeature({name:'exam-checking',adapter:BullMQAdapter}),
    DatabaseModule, 
    ExamsModule, 
    AiModule],
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsRepo, AttemptProcessor],
})
export class AttemptsModule {}
