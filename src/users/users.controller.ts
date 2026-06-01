import { Controller, Get,Post, Body, Param, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';

import { createProfileDto } from './dto/create-profile.dto';
import { createUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

}
