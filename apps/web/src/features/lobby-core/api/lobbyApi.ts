import { apiFetch } from '#/features/shared/api/client';
import { z } from 'zod';

export interface ActiveSession {
  lobbyId: string;
  quizTitle: string;
}

const createLobbyResponseSchema = z.object({
  lobbyId: z.string(),
});

export const lobbyApi = {
  fetchActiveSessions: async (): Promise<ActiveSession[]> => {
    const { data, error } = await apiFetch<ActiveSession[]>('/game/active');
    if (error) throw error;
    return data;
  },

  verifyLobbyExists: async (code: string): Promise<boolean> => {
    const { data, error } = await apiFetch<{ exists: boolean }>(`/game/lobby/${code}/exists`);
    if (error || !data?.exists) return false;
    return true;
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
};
