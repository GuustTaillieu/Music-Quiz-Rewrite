import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '#/lib/api';
import { z } from 'zod';
import { QuizSchema } from '@spotify-music-quiz/shared/schema/game';

// We map QuizMetaSchema to allow optional creatorId and flexible datetimes for dev
const clientQuizMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export const quizzesQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await apiFetch('/quizzes', {
        schema: z.array(clientQuizMetaSchema),
      });
      if (error) throw error;
      return data;
    },
    enabled,
  });

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
