import { z } from 'zod';

const webEnvSchema = z.object({
  VITE_API_URL: z.url('VITE_API_URL must be a valid URL').optional(),
  VITE_WS_URL: z.url('VITE_WS_URL must be a valid URL').optional(),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

function validateWebEnv(): WebEnv {
  const envObj = {
    VITE_API_URL: import.meta.env.VITE_API_URL || undefined,
    VITE_WS_URL: import.meta.env.VITE_WS_URL || undefined,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  const result = webEnvSchema.safeParse(envObj);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - [${issue.path.join('.') || 'root'}]: ${issue.message}`)
      .join('\n');
    console.error(`\n❌ [Web Env Error] Invalid environment variables:\n${errorDetails}\n`);
    throw new Error(`Web startup failed due to invalid environment variables:\n${errorDetails}`);
  }
  return result.data;
}

export const env = validateWebEnv();

/**
 * Returns the resolved API base URL.
 * - In browser: uses window.location.origin in dev/LAN or when proxying,
 *   or explicitly configured VITE_API_URL in production.
 * - In SSR: uses VITE_API_URL (or local dev default).
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (env.PROD && env.VITE_API_URL) {
      return env.VITE_API_URL;
    }
    return window.location.origin;
  }
  return env.VITE_API_URL ?? 'http://127.0.0.1:3001';
}

/**
 * Returns the resolved WebSocket URL.
 * - In browser: uses window.location.origin (proxied by Vite) in dev/LAN,
 *   or explicitly configured VITE_WS_URL in production.
 * - In SSR: uses VITE_WS_URL (or local dev default).
 */
export function getWsUrl(): string {
  if (typeof window !== 'undefined') {
    if (env.PROD && env.VITE_WS_URL) {
      return env.VITE_WS_URL;
    }
    return window.location.origin;
  }
  return env.VITE_WS_URL ?? 'http://127.0.0.1:3001';
}
