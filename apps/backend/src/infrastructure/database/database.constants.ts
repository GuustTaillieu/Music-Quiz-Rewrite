import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
export type DrizzleDb = NodePgDatabase<typeof schema>;
