import { queryOptions } from '@tanstack/react-query';
import { editorService } from './editorService';

export const editorQueries = {
  quiz: (quizId: string, enabled: boolean) =>
    queryOptions({
      queryKey: ['quiz', quizId],
      queryFn: () => editorService.fetchQuiz(quizId),
      enabled,
      retry: false,
    }),

  spotifySearch: (deferredQuery: string, enabled: boolean) =>
    queryOptions({
      queryKey: ['spotify-search', deferredQuery],
      queryFn: () => editorService.searchSpotifyCatalog(deferredQuery),
      enabled: enabled && !!deferredQuery,
    }),
};
