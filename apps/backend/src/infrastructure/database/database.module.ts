import { Module, Provider } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { QuizRepository } from '../../ports/quiz.repository.port';
import { DrizzleQuizRepository } from './drizzle-quiz.repository';
import { GameSessionRepository } from '../../ports/game-session.repository.port';
import { InMemoryGameSessionRepository } from './in-memory-game-session.repository';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export type DrizzleDb = NodePgDatabase<typeof schema>;

const databaseProvider: Provider = {
  provide: DATABASE_CONNECTION,
  useFactory: () => {
    const pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/spotify_quiz',
    });
    return drizzle(pool, { schema });
  },
};

@Module({
  providers: [
    databaseProvider,
    {
      provide: QuizRepository,
      useClass: DrizzleQuizRepository,
    },
    {
      provide: GameSessionRepository,
      useClass: InMemoryGameSessionRepository,
    },
  ],
  exports: [DATABASE_CONNECTION, QuizRepository, GameSessionRepository],
})
export class DatabaseModule {}
