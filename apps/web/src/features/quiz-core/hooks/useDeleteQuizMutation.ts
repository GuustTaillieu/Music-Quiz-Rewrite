import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api/quizApi';

export function useDeleteQuizMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => quizApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}
