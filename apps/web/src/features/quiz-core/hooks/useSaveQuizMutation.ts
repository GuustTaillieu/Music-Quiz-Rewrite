import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api/quizApi';
import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';

export function useSaveQuizMutation(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description: string; songs: QuizSong[] }) =>
      quizApi.saveQuiz(quizId, payload),
    onSuccess: (updatedQuiz) => {
      queryClient.setQueryData(['quiz', quizId], updatedQuiz);
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}
