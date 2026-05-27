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
    login(@Req() req, @Res({passthrough:true}) res:Express.Response){
        const user=req.user;
        const tokens=this.authService.generateTokens({sub:user.id, email:user.email});
        //set refresh_token to cookie
        res.cookie('refreshToken', tokens.refresh_token, this.cookieSettings)
        return {
            access_token:tokens.access_token
        }
     }
    @Post('refresh')
    @ApiResponse({
        status:201,
        description:"Token validated",
        schema:{
            example:{access_token:'eyJhbg...'}
        }
    })
    async refresh(@Req() req:Express.Request){
        const refresh_token=req.cookies['refreshToken'];
        if (!refresh_token) {
        throw new UnauthorizedException('No refresh token found');
        }
        const access_token= await this.authService.refreshToken(refresh_token);
        return {
            access_token:access_token
        }
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
