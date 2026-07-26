import { quizApi } from '#/features/quiz-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSyncQuizMutation(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => quizApi.syncQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });
}
