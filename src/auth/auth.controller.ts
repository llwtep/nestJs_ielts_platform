import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { jwtGuard } from './guards/jwt.guard';
import { createUserDto } from 'src/users/dto/create-user.dto';
import * as Express from 'express';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { authPayloadDto } from './dto/auth.dto';
@Controller('auth')
export class AuthController {
    private readonly cookieSettings={
            httpOnly:true,
            secure:false,
            sameSite:'lax' as const,
            maxAge:7*24*60*60*1000
        }
    constructor(private authService:AuthService){
    }
    @Post('login')
    @ApiBody({type:authPayloadDto})
    @ApiResponse({
        status:201,
        description:"User authenticated",
        schema:{
            example:{access_token:'eyJhbg...'}
        }
    })
    @UsePipes(new ValidationPipe())
    @UseGuards(LocalGuard)
    async login(@Req() req){
        const user=req.user;
        const tokens=this.authService.generateTokens({sub:user.id, email:user.email});
        await this.authService.updateRefreshToken(user.id, tokens.refresh_token);
        return tokens;
     }

    @Post('refresh')
    @ApiResponse({
        status:201,
        description:"Token validated",
        schema:{
            example:{access_token:'eyJhbg...'}
        }
    })
    async refresh(@Body('refresh_token') refreshToken:string){
        const tokens=await this.authService.refreshToken(refreshToken);
        return tokens;
    }
    @Post('signup')
    @ApiResponse({
        status:201,
        description:"User created",
        schema:{
            example:{"message":"successfully created"}
        }
    })
    signup(@Body(ValidationPipe) newuser:createUserDto){
        const user=this.authService.sign(newuser);
        return {"message":"successfully created"}
    }

     @Get('status')
     @UseGuards(jwtGuard)
     status(@Req() req){
        return req.user
     }


}
