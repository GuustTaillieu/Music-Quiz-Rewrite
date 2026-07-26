import { apiFetch } from '#/features/shared/api/client';
import { z } from 'zod';
import { QuizSchema } from '@spotify-music-quiz/shared/schema/game';
import type { Quiz, QuizSong } from '@spotify-music-quiz/shared/schema/game';

export interface QuizMeta {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  songCount?: number;
  forkedFromQuizId?: string | null;
  forkedFrom?: {
    id: string;
    title: string;
    creatorName: string;
  } | null;
}

const clientQuizMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  songCount: z.number().optional(),
  forkedFromQuizId: z.string().nullable().optional(),
  forkedFrom: z.object({
    id: z.string(),
    title: z.string(),
    creatorName: z.string(),
  }).nullable().optional(),
});

export const quizApi = {
  fetchQuizzes: async (): Promise<QuizMeta[]> => {
    const { data, error } = await apiFetch('/quizzes', {
      schema: z.array(clientQuizMetaSchema),
    });
    if (error) throw error;
    return data;
  },

  fetchQuiz: async (quizId: string): Promise<Quiz | null> => {
    const { data, error } = await apiFetch(`/quizzes/${quizId}`, {
      schema: QuizSchema.nullable(),
    });
    if (error) throw error;
    return data;
  },

  createQuiz: async (payload: { title: string; description: string }): Promise<Quiz> => {
    const { data, error } = await apiFetch<Quiz>('/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (error) throw error;
    return data;
  },

  saveQuiz: async (quizId: string, payload: { title: string; description: string; songs: QuizSong[] }): Promise<Quiz> => {
    const { data, error } = await apiFetch<Quiz>(`/quizzes/${quizId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        songs: payload.songs.map((s) => ({
          id: s.id,
          originalSongId: s.originalSongId,
          isUserModified: true,
          spotifyTrackId: s.spotifyTrackId,
          track: s.track,
          questionType: s.questionType,
          start_offset_ms: s.start_offset_ms,
          end_offset_ms: s.end_offset_ms,
          lyricsGap: s.lyricsGap,
        })),
      }),
    });
    if (error) throw error;
    return data;
  },

  deleteQuiz: async (quizId: string): Promise<void> => {
    const { error } = await apiFetch(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
    if (error) throw error;
  },

  forkQuiz: async (quizId: string): Promise<Quiz> => {
    const { data, error } = await apiFetch<Quiz>(`/quizzes/${quizId}/fork`, {
      method: 'POST',
    });
    if (error) throw error;
    return data;
  },

  syncQuiz: async (quizId: string): Promise<{ addedCount: number; updatedCount: number; preservedCount: number }> => {
    const { data, error } = await apiFetch<{ addedCount: number; updatedCount: number; preservedCount: number }>(`/quizzes/${quizId}/sync`, {
      method: 'POST',
    });
    if (error) throw error;
    return data;
  },
};
