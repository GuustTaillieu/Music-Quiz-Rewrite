import { apiFetch } from '#/features/shared/api/client';
import type {
  GenerateQuizPayload,
  SuggestSongsPayload,
  UserAiProfile,
  Quiz,
  QuizSong,
} from '@spotify-music-quiz/shared/schema/game';

export const aiQuizApi = {
  async getProfile(): Promise<UserAiProfile> {
    const { data, error } = await apiFetch<UserAiProfile>('/ai-quiz/profile');
    if (error) throw error;
    return data;
  },

  async setApiKey(apiKey: string | null): Promise<UserAiProfile> {
    const { data, error } = await apiFetch<UserAiProfile>('/ai-quiz/api-key', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    if (error) throw error;
    return data;
  },

  async generateQuiz(
    payload: GenerateQuizPayload,
  ): Promise<{ quiz: Quiz; targetMode: 'INSTANT_PLAY' | 'STUDIO' }> {
    const { data, error } = await apiFetch<{ quiz: Quiz; targetMode: 'INSTANT_PLAY' | 'STUDIO' }>(
      '/ai-quiz/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (error) throw error;
    return data;
  },

  async suggestTracks(payload: SuggestSongsPayload): Promise<QuizSong[]> {
    const { data, error } = await apiFetch<QuizSong[]>('/ai-quiz/suggest-tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (error) throw error;
    return data;
  },
};
