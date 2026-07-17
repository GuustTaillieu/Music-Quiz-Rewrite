import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
