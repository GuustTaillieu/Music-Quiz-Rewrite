import { queryOptions } from '@tanstack/react-query';
import type { GameSessionState } from '@spotify-music-quiz/shared/schema/game';

export const gameSessionQueryOptions = (lobbyId: string) =>
  queryOptions<GameSessionState | null>({
    queryKey: ['gameSession', lobbyId.toUpperCase()],
    queryFn: () => null,
    staleTime: Infinity,
  });
