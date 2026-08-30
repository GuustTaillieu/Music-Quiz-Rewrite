import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const potentialEnvPaths = [
  path.join(process.cwd(), 'apps', 'backend', '.env.local'),
  path.join(process.cwd(), 'apps', 'backend', '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
];

const foundPath = potentialEnvPaths.find((p) => fs.existsSync(p));

if (foundPath) {
  console.log('[Env] Loading local environment file from:', foundPath);
  dotenv.config({ path: foundPath });
} else {
  // In production (Render, Docker, CI), variables are injected directly into process.env
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Env] No local .env file found; using system environment variables.');
  }
}
