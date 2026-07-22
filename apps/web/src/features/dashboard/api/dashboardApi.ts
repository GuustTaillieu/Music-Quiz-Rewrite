import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '#/features/shared/api/client';
import { z } from 'zod';

const clientQuizMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  songCount: z.number().optional(),
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

export const activeSessionsQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const { data, error } = await apiFetch<Array<{ lobbyId: string; quizTitle: string }>>('/game/active');
      if (error) throw error;
      return data;
    },
    enabled,
    refetchInterval: 5000,
  });
