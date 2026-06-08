import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";


export class authPayloadDto{
    @ApiProperty()
    @IsEmail()
    email!:string;
    @IsString()
    password!:string;
}

export class authRefreshDto{
    @ApiProperty()
    @IsString()
    refresh_token!:string;
}