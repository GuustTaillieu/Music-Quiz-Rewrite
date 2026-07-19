import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { GameService } from './game.service';

export class CreateLobbyDto {
  quizId!: string;
}

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('active')
  @UseGuards(AuthGuard)
  public async getActiveSessions(
    @Session() session: UserSession,
  ): Promise<Array<{ lobbyId: string; quizTitle: string }>> {
    return this.gameService.getActiveSessionsForHost(session.user.id);
  }

  @Post('lobby')
  @UseGuards(AuthGuard)
  public async createLobby(
    @Body() body: CreateLobbyDto,
    @Session() session: UserSession,
  ): Promise<{ lobbyId: string }> {
    const lobbyId = await this.gameService.createLobby(
      body.quizId,
      session.user.id,
    );
    return { lobbyId };
  }
}
