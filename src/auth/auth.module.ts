import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { localStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports:[
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory: async (configService:ConfigService)=>({
        secret: configService.get<string>('SECRETJWT'),
      })
    }),
    UsersModule
    ],
  controllers: [AuthController],
  providers: [AuthService, localStrategy, JwtStrategy],
  exports:[AuthService,JwtModule]
})
export class AuthModule {}
