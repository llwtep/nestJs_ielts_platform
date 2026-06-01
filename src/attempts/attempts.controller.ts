import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { jwtGuard } from 'src/auth/guards/jwt.guard';
import { attemptCreateDto, AttemptUpdateDto } from './dto/attempts.dto';
import { ApiParam } from '@nestjs/swagger';
import { numeric } from 'drizzle-orm/pg-core';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('')
  @UseGuards(jwtGuard)
  async start_attempt(@Req() req,@Body() attempt:attemptCreateDto){
    attempt.userId=req.user.sub;
    return await this.attemptsService.startAttempt(attempt);
  }

  @Patch(':id')
  @UseGuards(jwtGuard)
  @ApiParam({
    name:'id',
    description:'Attempt id',
    type:Number
  })
  async saveDraft(
    @Param('id', ParseIntPipe) id:number,
    @Body() updatedAttempt:AttemptUpdateDto
    ){
      return await this.attemptsService.updateAttempt(id,updatedAttempt);
    }

    @Post('finish/:id')
    @UseGuards(jwtGuard)
    @ApiParam({
      name:'id',
      description:'attempt id',
      type:Number,
    })
    async finishAttempt(
      @Param('id', ParseIntPipe) id:number,
       @Body() updatedAttempt:AttemptUpdateDto
    ){
      return await this.attemptsService.finishAttempt(id,updatedAttempt)
    }

    @Get(':id')
    @UseGuards(jwtGuard)
    @ApiParam({
      name:'id',
      description:"User id",
      example:67,
      type:Number
    })
    async getAttemptByUserId(
      @Param('id', ParseIntPipe) id:number,
    ){
      return await this.attemptsService.getAttemptsByUserId(id);
    }

}
