import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lobbyApi } from '../api/lobbyApi';

export function useTerminateLobbyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lobbyId: string) => lobbyApi.terminateLobby(lobbyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLobbies'] });
    },
  });
}
