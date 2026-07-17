import { GameSession } from '../domain/game-session';

export abstract class GameSessionRepository {
  abstract findById(id: string): Promise<GameSession | null>;
  abstract save(session: GameSession): Promise<void>;
  abstract delete(id: string): Promise<boolean>;
}
