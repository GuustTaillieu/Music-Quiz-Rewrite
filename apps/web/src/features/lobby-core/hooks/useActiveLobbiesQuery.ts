import { useQuery } from '@tanstack/react-query';
import { lobbyApi, type ActiveSession } from '../api/lobbyApi';

export function useActiveLobbiesQuery() {
  return useQuery<ActiveSession[]>({
    queryKey: ['activeLobbies'],
    queryFn: lobbyApi.fetchActiveSessions,
  });
}
