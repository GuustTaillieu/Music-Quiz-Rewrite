import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizRepository } from '../ports/quiz.repository.port';
import { GameSessionRepository } from '../ports/game-session.repository.port';
import { GameSession } from '../domain/game-session';
import { GameSessionState } from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class GameService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly gameSessionRepository: GameSessionRepository,
  ) {}

  public async createLobby(quizId: string, hostId: string): Promise<string> {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Generate unique 4-character uppercase code
    let lobbyId = '';
    let isUnique = false;
    while (!isUnique) {
      lobbyId = this.generateLobbyId();
      const existing = await this.gameSessionRepository.findById(lobbyId);
      if (!existing) {
        isUnique = true;
      }
    }

    const session = new GameSession(lobbyId, hostId, quiz);
    // The host automatically joins when starting/creating the lobby
    // (Lobby creation implies host is present)
    await this.gameSessionRepository.save(session);
    return lobbyId;
  }

  public async getLobbyState(
    lobbyId: string,
    playerId: string,
  ): Promise<GameSessionState> {
    const session = await this.gameSessionRepository.findById(lobbyId);
    if (!session) {
      throw new NotFoundException(`Lobby ${lobbyId} not found`);
    }
    return session.getSanitizedState(playerId);
  }

  public async startGame(
    lobbyId: string,
    hostId: string,
  ): Promise<GameSessionState> {
    const session = await this.gameSessionRepository.findById(lobbyId);
    if (!session) {
      throw new NotFoundException(`Lobby ${lobbyId} not found`);
    }

    session.start(hostId);
    await this.gameSessionRepository.save(session);
    return session.getSanitizedState(hostId);
  }

  public async submitGuess(
    lobbyId: string,
    playerId: string,
    guess: string,
  ): Promise<{ correct: boolean; state: GameSessionState }> {
    const session = await this.gameSessionRepository.findById(lobbyId);
    if (!session) {
      throw new NotFoundException(`Lobby ${lobbyId} not found`);
    }

    const correct = session.submitGuess(playerId, guess);
    await this.gameSessionRepository.save(session);
    return {
      correct,
      state: session.getSanitizedState(playerId),
    };
  }

  public async passTurn(
    lobbyId: string,
    playerId: string,
  ): Promise<GameSessionState> {
    const session = await this.gameSessionRepository.findById(lobbyId);
    if (!session) {
      throw new NotFoundException(`Lobby ${lobbyId} not found`);
    }

    session.passTurn(playerId);
    await this.gameSessionRepository.save(session);
    return session.getSanitizedState(playerId);
  }

  public async removePlayer(
    lobbyId: string,
    playerId: string,
  ): Promise<GameSessionState | null> {
    const session = await this.gameSessionRepository.findById(lobbyId);
    if (!session) {
      return null;
    }

    session.removePlayer(playerId);

    const activeCount = session.players.filter((p) => !p.isDisconnected).length;
    if (activeCount === 0) {
      await this.gameSessionRepository.delete(lobbyId);
      return null;
    }

    await this.gameSessionRepository.save(session);
    return session.getSanitizedState(playerId);
  }

  public async addPlayer(
    lobbyId: string,
    playerId: string,
    username: string,
  ): Promise<GameSessionState> {
    const session = await this.gameSessionRepository.findById(lobbyId);
    if (!session) {
      throw new NotFoundException(`Lobby ${lobbyId} not found`);
    }

    session.addPlayer(playerId, username);
    await this.gameSessionRepository.save(session);
    return session.getSanitizedState(playerId);
  }

  private generateLobbyId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
