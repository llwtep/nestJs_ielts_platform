import { Injectable } from '@nestjs/common';
import { UserRepository } from './users.repository';
import { createUserDto } from './dto/create-user.dto';
@Injectable()
export class UsersService {
    constructor(private readonly userRepo:UserRepository){}
    async getByEmail(email:string){
        const user=await this.userRepo.getByEmail(email);
        return user;
    }
    async create(user:createUserDto){
        const newuser=await this.userRepo.createUser(user);
        return newuser;
    }

}
