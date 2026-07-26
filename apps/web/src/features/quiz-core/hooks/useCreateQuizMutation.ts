import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api/quizApi';

export function useCreateQuizMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description: string }) => quizApi.createQuiz(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}
