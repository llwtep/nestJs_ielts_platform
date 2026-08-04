import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { jwtGuard } from 'src/auth/guards/jwt.guard';
import { attemptCreateDto, AttemptUpdateDto } from './dto/attempts.dto';
import { ApiParam, ApiBearerAuth} from '@nestjs/swagger';


@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('')
  @UseGuards(jwtGuard)
  @ApiBearerAuth()
  async start_attempt(@Req() req,@Body() attempt:attemptCreateDto){
    attempt.userId=req.user.sub;
    return await this.attemptsService.startAttempt(attempt);
  }

  @Patch(':id')
  @UseGuards(jwtGuard)
  @ApiBearerAuth()
  @ApiParam({
    name:'id',
    description:'Attempt id',
    type:String
  })
  async saveDraft(
    @Param('id') id:string,
    @Body() updatedAttempt:AttemptUpdateDto
    ){
      return await this.attemptsService.updateAttempt(id,updatedAttempt);
    }

    @Post('finish/:id')
    @UseGuards(jwtGuard)
    @ApiBearerAuth()
    @ApiParam({
      name:'id',
      description:'attempt id',
      type:String,
    })
    async finishAttempt(
      @Param('id') id:string,
       @Body() updatedAttempt:AttemptUpdateDto
    ){
      return await this.attemptsService.finishAttempt(id,updatedAttempt)
    }

    @Get('mine')
    @UseGuards(jwtGuard)
    @ApiBearerAuth()
    async getMyAttempts(
      @Req() req,
    ){
      return await this.attemptsService.getAttemptsByUserId(req.user.sub);
    }

}
