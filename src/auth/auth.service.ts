import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { authPayloadDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createUserDto } from 'src/users/dto/create-user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
@Injectable()
export class AuthService {
    constructor(
        private userService:UsersService,
        private jwtService:JwtService, 
        @Inject(CACHE_MANAGER) private cacheManager: Cache){}
    async validateUser(authPayload:authPayloadDto){
        const findUser=await this.userService.getByEmail(authPayload.email);
        if (!findUser || !findUser.password) return null;
        if (findUser){
            const isMatch=await bcrypt.compare(authPayload.password, findUser.password);
            if (isMatch){
                const {password, ...user}=findUser;
                return user;
            }
            return null;
        }
    }

    async sign(user:createUserDto){
        const saltOrRounds=10;
        const hashedPassword=await bcrypt.hash(user.password, saltOrRounds);
        return this.userService.create({...user,password:hashedPassword});
    }

    generateTokens(payload){
        const access_token=this.jwtService.sign(payload,{
            expiresIn:'15m'
        });
        const refresh_token=this.jwtService.sign(payload,{
            expiresIn:'7d'
        })
        return {access_token:access_token,
                refresh_token:refresh_token
        }
    }

    async updateRefreshToken(userId:number, refreshToken:string){
    const hashedRefreshToken=await bcrypt.hash(refreshToken,10);
    await this.cacheManager.set(`refreshToken:${userId}`, hashedRefreshToken, 7*24*60*60*1000);
    }

    async refreshToken(token:string){
        try{
            const payload=await this.jwtService.verifyAsync(token);
            const hashedRefreshToken=await this.cacheManager.get(`refreshToken:${payload.sub}`) as string;
            if (!hashedRefreshToken || !await bcrypt.compare(token, hashedRefreshToken)) throw new UnauthorizedException('No refresh token found');
            const tokens=this.generateTokens({sub:payload.sub, email:payload.email});
            await this.updateRefreshToken(payload.sub, tokens.refresh_token);
            return tokens; 
        } catch (e){
            throw new UnauthorizedException('Token expired or invalid')
        }

    }

}
