import { useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '#/features/shared/api/client';
import type { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

export function useTrackSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [, startTransition] = useTransition();

  const searchQueryResult = useQuery<SpotifyTrack[]>({
    queryKey: ['trackSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await apiFetch<SpotifyTrack[]>(
        `/spotify/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  return {
    searchQuery,
    setSearchQuery,
    startTransition,
    searchResults: searchQueryResult.data ?? [],
    isSearching: searchQueryResult.isLoading,
    isError: searchQueryResult.isError,
  };
}
