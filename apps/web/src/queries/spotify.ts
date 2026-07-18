import { queryOptions } from '@tanstack/react-query';
import { apiFetch } from '#/lib/api';
import { z } from 'zod';
import { SpotifyTrackSchema } from '@spotify-music-quiz/shared/schema/game';

export const spotifySearchQueryOptions = (
  deferredQuery: string,
  enabled: boolean,
) =>
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
