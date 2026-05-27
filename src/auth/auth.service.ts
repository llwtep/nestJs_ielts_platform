import { Injectable, UnauthorizedException } from '@nestjs/common';
import { authPayloadDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createUserDto } from 'src/users/dto/create-user.dto';
@Injectable()
export class AuthService {
    constructor(private userService:UsersService, private jwtService:JwtService){}
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
        const access_token=this.jwtService.sign(payload);
        const refresh_token=this.jwtService.sign(payload,{
            expiresIn:'7d'
        })
        return {access_token:access_token,
                refresh_token:refresh_token
        }
    }

    async refreshToken(token:string){
        try{
            const payload=await this.jwtService.verifyAsync(token);
            const user=await this.userService.getByEmail(payload.email)
            if(!user){
                throw new UnauthorizedException('Invalid refresh token');
            }
            const access_token=this.jwtService.sign(({sub:user.id, email:user.email}))
            return access_token;

        } catch (e){
            throw new UnauthorizedException('Token expired or invalid')
        }

    }

}
