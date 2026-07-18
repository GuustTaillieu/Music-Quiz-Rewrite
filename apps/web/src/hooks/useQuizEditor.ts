import { useState, useEffect, useRef, useTransition, useDeferredValue } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { authClient } from '#/lib/auth-client';
import { apiFetch } from '#/lib/api';
import { quizQueryOptions } from '#/queries/quizzes';
import { spotifySearchQueryOptions } from '#/queries/spotify';
import type { Quiz, QuizSong, SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

export function useQuizEditor(quizId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();

  const isLoggedIn = !!sessionData?.user;

  // Local Quiz State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [songs, setSongs] = useState<QuizSong[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();

  // Selected Quiz Song for offset editing
  const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null);

  // Audio Preview State
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Virtualized list parent ref
  const parentRef = useRef<HTMLDivElement | null>(null);

  // Load Quiz if editing
  const { data: loadedQuiz, isLoading: isQuizLoading } = useQuery(
    quizQueryOptions(quizId, isLoggedIn),
  );

  // Sync loaded quiz to local state
  useEffect(() => {
    if (loadedQuiz) {
      setTitle(loadedQuiz.title);
      setDescription(loadedQuiz.description ?? '');
      setSongs(loadedQuiz.songs);
      if (loadedQuiz.songs.length > 0) {
        setSelectedSongIndex(0);
      }
    }
  }, [loadedQuiz]);

  // Search Spotify Catalog
  const { data: searchResults, isFetching: isSearching } = useQuery(
    spotifySearchQueryOptions(deferredSearchQuery, isLoggedIn),
  );

  // Save Mutation using apiFetch
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await apiFetch<Quiz>(`/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          songs: songs.map((s) => ({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      navigate({ to: '/studio' });
    },
  });

  // Virtualizer Setup for Spotify Search Results
  const rowVirtualizer = useVirtualizer({
    count: searchResults?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const handleAddTrack = (track: SpotifyTrack) => {
    const newSong: QuizSong = {
      spotifyTrackId: track.id,
      track,
      questionType: 'TRACK_NAME',
      start_offset_ms: 0,
      end_offset_ms: 30000,
      lyricsGap: '',
    };
    setSongs((prev) => {
      const updated = [...prev, newSong];
      setSelectedSongIndex(updated.length - 1);
      return updated;
    });
  };

  const handleRemoveTrack = (index: number) => {
    setSongs((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (selectedSongIndex === index) {
        setSelectedSongIndex(updated.length > 0 ? 0 : null);
      } else if (selectedSongIndex !== null && selectedSongIndex > index) {
        setSelectedSongIndex(selectedSongIndex - 1);
      }
      return updated;
    });
  };

  const handleMoveTrack = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === songs.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    setSongs((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
    setSelectedSongIndex(targetIdx);
  };

  const handleSongChange = <K extends keyof QuizSong>(
    index: number,
    key: K,
    value: QuizSong[K],
  ) => {
    setSongs((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };
      return updated;
    });
  };

  const startPreview = (track: SpotifyTrack) => {
    if (!track.previewUrl) {
      alert('Preview not available for this track.');
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = track.previewUrl;
      audioRef.current.play();
      setPreviewingTrackId(track.id);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPreviewingTrackId(null);
    }
  };

  const selectedSong =
    selectedSongIndex !== null && selectedSongIndex < songs.length
      ? songs[selectedSongIndex]
      : null;

  return {
    navigate,
    sessionData,
    isSessionLoading,
    isQuizLoading,
    title,
    setTitle,
    description,
    setDescription,
    songs,
    searchQuery,
    setSearchQuery,
    selectedSongIndex,
    setSelectedSongIndex,
    previewingTrackId,
    setPreviewingTrackId,
    audioRef,
    parentRef,
    searchResults,
    isSearching,
    saveMutation,
    rowVirtualizer,
    handleAddTrack,
    handleRemoveTrack,
    handleMoveTrack,
    handleSongChange,
    startPreview,
    stopPreview,
    selectedSong,
    loadedQuiz,
    isPending,
    startTransition,
  };
}
