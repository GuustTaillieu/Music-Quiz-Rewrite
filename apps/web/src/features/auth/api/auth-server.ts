import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { authClient } from './auth-client';

export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders();
  const { data } = await authClient.getSession({
    fetchOptions: {
      headers,
    },
  });

  return data;
});
