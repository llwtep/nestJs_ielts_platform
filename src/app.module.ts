import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule} from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ExamsModule } from './exams/exams.module';
import { AttemptsModule } from './attempts/attempts.module';
import { AiModule } from './ai/ai.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from './cache-config.service';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { redisConnection } from './redis.config';
import { bullBoardAuth } from './bull-board-auth.middleware';
@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),
    CacheModule.registerAsync({
      isGlobal:true,
      useClass:CacheConfigService,
    }),
    BullModule.forRootAsync({
      inject:[ConfigService],
      useFactory:(config:ConfigService)=>({connection:redisConnection(config)}),
    }),
    BullBoardModule.forRootAsync({
      inject:[ConfigService],
      useFactory:(config:ConfigService)=>({
        route: '/admin/queues',
        adapter: ExpressAdapter,
        middleware: bullBoardAuth(
          config.getOrThrow<string>('BULL_BOARD_USER'),
          config.getOrThrow<string>('BULL_BOARD_PASSWORD'),
        ),
      }),
    }),
    DatabaseModule,
    UsersModule, 
    AuthModule, 
    ExamsModule,
    AttemptsModule,
    AiModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
