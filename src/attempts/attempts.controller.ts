import { Body, Controller, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { jwtGuard } from 'src/auth/guards/jwt.guard';
import { attemptCreateDto, AttemptUpdateDto } from './dto/attempts.dto';

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
  async saveDraft(
    @Param('id', ParseIntPipe) id:number,
    @Body() updatedAttempt:AttemptUpdateDto
    ){
      return await this.attemptsService.updateAttempt(id,updatedAttempt);
    }


}
