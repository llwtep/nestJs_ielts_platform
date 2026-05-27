import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ExamsModule } from './exams/exams.module';
import { AttemptsModule } from './attempts/attempts.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),
    DatabaseModule,
    UsersModule, 
    AuthModule, 
    ExamsModule, AttemptsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
