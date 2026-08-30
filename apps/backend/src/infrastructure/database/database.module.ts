import { Module, Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { QuizRepository } from '../../ports/quiz.repository.port';
import { DrizzleQuizRepository } from './drizzle-quiz.repository';
import { GameSessionRepository } from '../../ports/game-session.repository.port';
import { InMemoryGameSessionRepository } from './in-memory-game-session.repository';

import { DATABASE_CONNECTION } from './database.constants';
import type { DrizzleDb } from './database.constants';
import { env } from '../../env';

const databaseProvider: Provider = {
  provide: DATABASE_CONNECTION,
  useFactory: () => {
    const connectionString = env.DATABASE_URL;
    const isProduction = env.NODE_ENV === 'production';
    const hasSslParam =
      connectionString.includes('sslmode=require') ||
      connectionString.includes('ssl=true');

    const pool = new Pool({
      connectionString,
      ssl: isProduction || hasSslParam ? { rejectUnauthorized: false } : false,
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
