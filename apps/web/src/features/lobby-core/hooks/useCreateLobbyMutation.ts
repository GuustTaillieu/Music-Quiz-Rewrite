import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lobbyApi } from '../api/lobbyApi';

export function useCreateLobbyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => lobbyApi.createLobby(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLobbies'] });
    },
  });
}
