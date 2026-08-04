import { queryOptions } from '@tanstack/react-query';
import { lobbyApi } from '../api/lobbyApi';

export const lobbyVerifyQueryOptions = (code: string) =>
  queryOptions<boolean>({
    queryKey: ['lobbyExists', code.toUpperCase()],
    queryFn: () => lobbyApi.verifyLobbyExists(code),
    staleTime: 5000,
  });
