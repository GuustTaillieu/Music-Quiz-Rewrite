import { useState, useEffect, useRef, useTransition, useDeferredValue } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { authClient } from '#/features/auth/api/auth-client';
import { editorQueries } from '../api/editorQueries';
import { editorMutations } from '../api/editorMutations';
import { EDITOR_CONSTANTS } from '../constants/editorConstants';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import type { QuizSong, SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

export function useQuizEditorController(quizId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessionData, isPending: isSessionLoading } = authClient.useSession();
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
    editorQueries.quiz(quizId, isLoggedIn),
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
    editorQueries.spotifySearch(deferredSearchQuery, isLoggedIn),
  );

  // Save Success State
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);

  const saveMutation = useMutation({
    ...editorMutations.saveQuiz(quizId),
    mutationFn: () => editorMutations.saveQuiz(quizId).mutationFn({ title, description, songs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setShowSavedSuccess(true);
      setTimeout(() => setShowSavedSuccess(false), GAME_CONFIG.SUCCESS_TOAST_DURATION_MS);
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: searchResults?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => EDITOR_CONSTANTS.VIRTUALIZER_ROW_HEIGHT,
    overscan: EDITOR_CONSTANTS.VIRTUALIZER_OVERSCAN,
  });

  const handleAddTrack = (track: SpotifyTrack) => {
    if (songs.some((s) => s.spotifyTrackId === track.id)) {
      return;
    }

    const isAdele = track.title === 'Someone Like You' || track.id === 'track-3';
    const newSong: QuizSong = {
      spotifyTrackId: track.id,
      track,
      questionType: isAdele ? 'FILL_IN_THE_GAP' : 'TRACK_NAME',
      start_offset_ms: EDITOR_CONSTANTS.DEFAULT_START_OFFSET_MS,
      end_offset_ms: EDITOR_CONSTANTS.DEFAULT_END_OFFSET_MS,
      lyricsGap: isAdele ? EDITOR_CONSTANTS.SAMPLE_ADELE_GAP : '',
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

  const handleRemoveTrackById = (trackId: string) => {
    setSongs((prev) => {
      const idx = prev.findIndex((s) => s.spotifyTrackId === trackId);
      if (idx === -1) return prev;
      const updated = prev.filter((_, i) => i !== idx);
      if (selectedSongIndex === idx) {
        setSelectedSongIndex(updated.length > 0 ? 0 : null);
      } else if (selectedSongIndex !== null && selectedSongIndex > idx) {
        setSelectedSongIndex(selectedSongIndex - 1);
      }
      return updated;
    });
  };

  const handleSongChange = (
    index: number,
    keyOrUpdates: string | Partial<QuizSong>,
    value?: any,
  ) => {
    setSongs((prev) => {
      const updated = [...prev];
      if (typeof keyOrUpdates === 'string') {
        updated[index] = {
          ...updated[index],
          [keyOrUpdates]: value,
        };
      } else {
        updated[index] = {
          ...updated[index],
          ...keyOrUpdates,
        };
      }
      return updated;
    });
  };

  const startPreview = (track: SpotifyTrack) => {
    if (!track.previewUrl) {
      alert(EDITOR_CONSTANTS.ERRORS.PREVIEW_UNAVAILABLE);
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
    handleSongChange,
    startPreview,
    stopPreview,
    selectedSong,
    loadedQuiz,
    isPending,
    startTransition,
    showSavedSuccess,
    handleRemoveTrackById,
    handleReorderSongs: (startIndex: number, endIndex: number) => {
      setSongs((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        if (selectedSongIndex === startIndex) {
          setSelectedSongIndex(endIndex);
        } else if (selectedSongIndex !== null) {
          if (selectedSongIndex > startIndex && selectedSongIndex <= endIndex) {
            setSelectedSongIndex(selectedSongIndex - 1);
          } else if (selectedSongIndex < startIndex && selectedSongIndex >= endIndex) {
            setSelectedSongIndex(selectedSongIndex + 1);
          }
        }
        return result;
      });
    },
  };
}
