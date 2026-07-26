import { createAuthClient } from 'better-auth/react';

const isDev = import.meta.env.DEV;

export const authClient = createAuthClient({
  baseURL: isDev
    ? 'http://127.0.0.1:3000'
    : typeof window !== 'undefined'
    ? window.location.origin
    : (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000'),
});
