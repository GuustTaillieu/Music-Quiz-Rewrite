import { quizApi } from '#/features/quiz-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useForkQuizMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => quizApi.forkQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}
