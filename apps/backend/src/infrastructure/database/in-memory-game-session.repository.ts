import { Injectable } from '@nestjs/common';
import { GameSessionRepository } from '../../ports/game-session.repository.port';
import { GameSession } from '../../domain/game-session';

@Injectable()
export class InMemoryGameSessionRepository implements GameSessionRepository {
  private readonly sessions = new Map<string, GameSession>();

  public async findById(id: string): Promise<GameSession | null> {
    return this.sessions.get(id.toUpperCase()) ?? null;
  }

  public async save(session: GameSession): Promise<void> {
    this.sessions.set(session.lobbyId.toUpperCase(), session);
  }

  public async delete(id: string): Promise<boolean> {
    return this.sessions.delete(id.toUpperCase());
  }
}
