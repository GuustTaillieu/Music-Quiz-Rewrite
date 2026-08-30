import './load-env';
import { z } from 'zod';

const backendEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    FRONTEND_URL: z
      .url('FRONTEND_URL must be a valid URL (e.g. https://spotify-music-quiz.netlify.app)')
      .optional(),
    BETTER_AUTH_SECRET: z.string().optional(),
    SPOTIFY_CLIENT_ID: z.string().min(1, 'SPOTIFY_CLIENT_ID is required'),
    SPOTIFY_CLIENT_SECRET: z.string().min(1, 'SPOTIFY_CLIENT_SECRET is required'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    USE_MOCK_SPOTIFY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production' && !data.FRONTEND_URL) {
        return false;
      }
      return true;
    },
    {
      message: 'FRONTEND_URL is required in production environment',
      path: ['FRONTEND_URL'],
    },
  );

export type BackendEnv = z.infer<typeof backendEnvSchema>;

function validateEnv(): BackendEnv {
  const result = backendEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - [${issue.path.join('.') || 'root'}]: ${issue.message}`)
      .join('\n');
    console.error(`\n❌ [Backend Env Error] Missing or invalid environment variables:\n${errorDetails}\n`);
    throw new Error(`Backend startup failed due to invalid environment variables:\n${errorDetails}`);
  }
  return result.data;
}

export const env = validateEnv();
