import { apiFetch } from '#/features/shared/api/client';
import { z } from 'zod';
import { QuizSchema, SpotifyTrackSchema } from '@spotify-music-quiz/shared/schema/game';
import type { Quiz, QuizSong, SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

export const editorService = {
  fetchQuiz: async (quizId: string): Promise<Quiz | null> => {
    const { data, error } = await apiFetch(`/quizzes/${quizId}`, {
      schema: QuizSchema.nullable(),
    });
    if (error) throw error;
    return data;
  },

  searchSpotifyCatalog: async (query: string): Promise<SpotifyTrack[]> => {
    if (!query) return [];
    const { data, error } = await apiFetch(
      `/spotify/search?q=${encodeURIComponent(query)}`,
      {
        schema: z.array(SpotifyTrackSchema),
      },
    );
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
          isUserModified: true, // Mark song as customized by user when saved in studio
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

  syncQuiz: async (quizId: string): Promise<{ addedCount: number; updatedCount: number; preservedCount: number }> => {
    const { data, error } = await apiFetch<{ addedCount: number; updatedCount: number; preservedCount: number }>(`/quizzes/${quizId}/sync`, {
      method: 'POST',
    });
    if (error) throw error;
    return data;
  },

  fetchLyrics: async (artist: string, title: string): Promise<string | null> => {
    const { data, error } = await apiFetch<{ plainLyrics: string | null }>(
      `/spotify/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
    );
    if (error || !data.plainLyrics) return null;
    return data.plainLyrics;
  },
};
