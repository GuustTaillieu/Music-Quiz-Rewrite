import { apiFetch } from '#/features/shared/api/client';
import { z } from 'zod';

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

export interface ActiveSession {
  lobbyId: string;
  quizTitle: string;
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

const createLobbyResponseSchema = z.object({
  lobbyId: z.string(),
});

export const dashboardService = {
  fetchQuizzes: async (): Promise<QuizMeta[]> => {
    const { data, error } = await apiFetch('/quizzes', {
      schema: z.array(clientQuizMetaSchema),
    });
    if (error) throw error;
    return data;
  },

  fetchActiveSessions: async (): Promise<ActiveSession[]> => {
    const { data, error } = await apiFetch<ActiveSession[]>('/game/active');
    if (error) throw error;
    return data;
  },

  verifyLobbyExists: async (code: string): Promise<boolean> => {
    const { data, error } = await apiFetch<{ exists: boolean }>(`/game/lobby/${code}/exists`);
    if (error || !data.exists) return false;
    return true;
  },

  createQuiz: async (payload: { title: string; description: string }): Promise<any> => {
    const { data, error } = await apiFetch<any>('/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (error) throw error;
    return data;
  },

  createLobby: async (quizId: string): Promise<{ lobbyId: string }> => {
    const { data, error } = await apiFetch('/game/lobby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
      schema: createLobbyResponseSchema,
    });
    if (error) throw error;
    return data;
  },

  terminateLobby: async (lobbyId: string): Promise<void> => {
    const { error } = await apiFetch(`/game/lobby/${lobbyId}`, {
      method: 'DELETE',
    });
    if (error) throw error;
  },

  forkQuiz: async (quizId: string): Promise<any> => {
    const { data, error } = await apiFetch<any>(`/quizzes/${quizId}/fork`, {
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

  deleteQuiz: async (quizId: string): Promise<void> => {
    const { error } = await apiFetch(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
    if (error) throw error;
  },
};
