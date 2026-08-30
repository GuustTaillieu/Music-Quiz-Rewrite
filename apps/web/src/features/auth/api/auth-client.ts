import { createAuthClient } from 'better-auth/react';
import { getApiBaseUrl } from '#/features/shared/config/env';

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
});

