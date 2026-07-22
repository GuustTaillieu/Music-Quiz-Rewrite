import { mutationOptions } from '@tanstack/react-query';
import { dashboardService } from './dashboardService';

export const dashboardMutations = {
  createQuiz: () =>
    mutationOptions({
      mutationFn: (data: { title: string; description: string }) =>
        dashboardService.createQuiz(data),
    }),

  terminateLobby: () =>
    mutationOptions({
      mutationFn: (lobbyId: string) => dashboardService.terminateLobby(lobbyId),
    }),
};
