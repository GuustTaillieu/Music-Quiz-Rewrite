import { Controller, Post, Get, Delete, Body, UseGuards, Param } from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type UserSession,
  AllowAnonymous,
} from '@thallesp/nestjs-better-auth';
import { GameService } from './game.service';

export class CreateLobbyDto {
  quizId!: string;
}

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('lobby/:lobbyId/exists')
  @AllowAnonymous()
  public async checkLobbyExists(
    @Param('lobbyId') lobbyId: string,
  ): Promise<{ exists: boolean }> {
    const exists = await this.gameService.checkLobbyExists(lobbyId.toUpperCase());
    return { exists };
  }

  @Delete('lobby/:lobbyId')
  @UseGuards(AuthGuard)
  public async terminateLobby(
    @Param('lobbyId') lobbyId: string,
    @Session() session: UserSession,
  ): Promise<{ success: boolean }> {
    await this.gameService.terminateLobby(lobbyId, session.user.id);
    return { success: true };
  }

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
