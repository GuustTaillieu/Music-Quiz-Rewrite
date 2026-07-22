import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '#/features/shared/api/client';
import { z } from 'zod';
import { QuizSchema, SpotifyTrackSchema } from '@spotify-music-quiz/shared/schema/game';

export const quizQueryOptions = (quizId: string, enabled: boolean) =>
  queryOptions({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await apiFetch(`/quizzes/${quizId}`, {
        schema: QuizSchema.nullable(),
      });
      if (error) throw error;
      return data;
    },
    enabled,
    retry: false,
  });

export const spotifySearchQueryOptions = (deferredQuery: string, enabled: boolean) =>
  queryOptions({
    queryKey: ['spotify-search', deferredQuery],
    queryFn: async () => {
      if (!deferredQuery) return [];
      const { data, error } = await apiFetch(
        `/spotify/search?q=${encodeURIComponent(deferredQuery)}`,
        {
          schema: z.array(SpotifyTrackSchema),
        },
      );
      if (error) throw error;
      return data;
    },
    enabled: enabled && !!deferredQuery,
  });
