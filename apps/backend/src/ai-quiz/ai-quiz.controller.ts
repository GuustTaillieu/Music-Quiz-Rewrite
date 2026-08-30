import { Controller, Get, Post, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { AuthGuard, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { AiQuizService } from './ai-quiz.service';
import {
  GenerateQuizPayloadSchema,
  SuggestSongsPayloadSchema,
  SetApiKeyPayloadSchema,
  type UserAiProfile,
  type Quiz,
  type QuizSong,
} from '@spotify-music-quiz/shared/schema/game';

@Controller('ai-quiz')
@UseGuards(AuthGuard)
export class AiQuizController {
  constructor(private readonly aiQuizService: AiQuizService) {}

  @Get('profile')
  public async getProfile(@Session() session: UserSession): Promise<UserAiProfile> {
    return this.aiQuizService.getUserAiProfile(session.user.id);
  }

  @Delete('google-account')
  public async unlinkGoogle(@Session() session: UserSession): Promise<UserAiProfile> {
    return this.aiQuizService.unlinkGoogleAccount(session.user.id);
  }

  @Put('api-key')
  public async setApiKey(
    @Session() session: UserSession,
    @Body() body: unknown,
  ): Promise<UserAiProfile> {
    const parsed = SetApiKeyPayloadSchema.parse(body);
    return this.aiQuizService.setCustomApiKey(session.user.id, parsed.apiKey);
  }

  @Post('generate')
  public async generate(
    @Session() session: UserSession,
    @Body() body: unknown,
  ): Promise<{ quiz: Quiz; targetMode: 'INSTANT_PLAY' | 'STUDIO' }> {
    const parsed = GenerateQuizPayloadSchema.parse(body);
    return this.aiQuizService.generateQuiz(session.user.id, parsed);
  }

  @Post('suggest-tracks')
  public async suggestTracks(
    @Session() session: UserSession,
    @Body() body: unknown,
  ): Promise<QuizSong[]> {
    const parsed = SuggestSongsPayloadSchema.parse(body);
    return this.aiQuizService.suggestSongs(session.user.id, parsed);
  }
}
