import { mutationOptions } from '@tanstack/react-query';
import { editorService } from './editorService';
import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';

export const editorMutations = {
  saveQuiz: (quizId: string) =>
    mutationOptions({
      mutationFn: (payload: { title: string; description: string; songs: QuizSong[] }) =>
        editorService.saveQuiz(quizId, payload),
    }),
};
