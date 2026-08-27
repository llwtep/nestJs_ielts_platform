import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { jwtGuard } from 'src/auth/guards/jwt.guard';
import { attemptCreateDto, AttemptUpdateDto } from './dto/attempts.dto';
import { ApiParam, ApiBearerAuth} from '@nestjs/swagger';


@Controller('attempts')
@UseGuards(jwtGuard)
@ApiBearerAuth()
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('')
  async start_attempt(@Req() req,@Body() attempt:attemptCreateDto){
    return await this.attemptsService.startAttempt(req.user.sub, attempt);
  }

  @Patch(':id')
  @ApiParam({
    name:'id',
    description:'Attempt id',
    type:String
  })
  async saveDraft(
    @Req() req,
    @Param('id', ParseUUIDPipe) id:string,
    @Body() updatedAttempt:AttemptUpdateDto
    ){
      return await this.attemptsService.updateAttempt(id,req.user.sub,updatedAttempt);
    }

    @Post('finish/:id')
    @ApiParam({
      name:'id',
      description:'attempt id',
      type:String,
    })
    async finishAttempt(
      @Req() req,
      @Param('id', ParseUUIDPipe) id:string,
       @Body() updatedAttempt:AttemptUpdateDto
    ){
      return await this.attemptsService.finishAttempt(id,req.user.sub,updatedAttempt)
    }

    @Get('mine')
    async getMyAttempts(
      @Req() req,
    ){
      return await this.attemptsService.getAttemptsByUserId(req.user.sub);
    }

    // результат проверки: фронт поллит этот эндпоинт после finish
    @Get(':id')
    @ApiParam({
      name:'id',
      description:'attempt id',
      type:String,
    })
    async getAttempt(
      @Req() req,
      @Param('id', ParseUUIDPipe) id:string,
    ){
      return await this.attemptsService.getAttemptResult(id, req.user.sub);
    }

}
