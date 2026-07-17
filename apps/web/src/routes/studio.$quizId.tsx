import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef, useTransition, useDeferredValue } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { authClient } from '#/lib/auth-client';
import {
  ArrowLeft,
  Save,
  Search,
  Plus,
  Trash2,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Disc,
  Music,
} from 'lucide-react';
import type { Quiz, QuizSong, SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

export const Route = createFileRoute('/studio/$quizId')({
  component: QuizEditor,
});

function QuizEditor() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();

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
  const { data: loadedQuiz, isLoading: isQuizLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.status === 404) {
        return null; // Signals new quiz
      }
      if (!res.ok) {
        throw new Error('Failed to load quiz');
      }
      return res.json() as Promise<Quiz>;
    },
    enabled: !!sessionData?.user,
    retry: false,
  });

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
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['spotify-search', deferredSearchQuery],
    queryFn: async () => {
      if (!deferredSearchQuery) return [];
      const res = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(deferredSearchQuery)}`,
      );
      if (!res.ok) {
        throw new Error('Search failed');
      }
      return res.json() as Promise<SpotifyTrack[]>;
    },
    enabled: !!deferredSearchQuery && !!sessionData?.user,
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
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

      if (!res.ok) {
        throw new Error('Failed to save quiz');
      }
      return res.json() as Promise<Quiz>;
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
    estimateSize: () => 72, // height of search item
    overscan: 5,
  });

  const handleAddTrack = (track: SpotifyTrack) => {
    const newSong: QuizSong = {
      spotifyTrackId: track.id,
      track,
      questionType: 'TRACK_NAME',
      start_offset_ms: 0,
      end_offset_ms: 30000, // 30 second snippet
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

  if (isSessionLoading || isQuizLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!sessionData?.user) {
    navigate({ to: '/' });
    return null;
  }

  const selectedSong =
    selectedSongIndex !== null && selectedSongIndex < songs.length
      ? songs[selectedSongIndex]
      : null;

  return (
    <div className="page-wrap min-h-screen py-12 flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Invisible Audio Element */}
      <audio ref={audioRef} onEnded={() => setPreviewingTrackId(null)} />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-line shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/studio' })}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foam/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="display-title text-3xl font-black text-foreground">
              {loadedQuiz ? 'Edit Quiz' : 'Create Quiz'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Add songs, configure question types, and set offset limits
            </p>
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !title.trim() || songs.length === 0}
          className="bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-2.5 px-5 rounded-xl hover:shadow-lg active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} /> {saveMutation.isPending ? 'Saving...' : 'Save Quiz'}
        </button>
      </div>

      {/* Main Body Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0">
        {/* Left Column: Metadata & Songs List */}
        <div className="island-shell p-6 rounded-2xl flex flex-col h-full min-h-0">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4 shrink-0">
            Quiz Meta
          </h2>
          <div className="space-y-4 mb-6 shrink-0">
            <input
              type="text"
              placeholder="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-2.5 font-bold text-foreground focus:outline-none focus:border-lagoon"
            />
            <textarea
              placeholder="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-lagoon resize-none"
            />
          </div>

          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-3 shrink-0 flex justify-between items-center">
            <span>Quiz Tracks</span>
            <span className="text-xs text-muted-foreground font-medium lowercase">
              {songs.length} tracks
            </span>
          </h3>

          {/* Songs list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {songs.map((song, index) => (
              <div
                key={index}
                onClick={() => setSelectedSongIndex(index)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${selectedSongIndex === index
                    ? 'border-lagoon bg-lagoon/5'
                    : 'border-line hover:border-muted-foreground/30'
                  }`}
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <span className="text-xs font-black text-muted-foreground shrink-0 w-4">
                    {index + 1}
                  </span>
                  <img
                    src={song.track.coverArtUrl}
                    alt={song.track.title}
                    className="h-9 w-9 rounded-lg border border-line shrink-0"
                  />
                  <div className="truncate">
                    <h4 className="font-bold text-foreground text-xs leading-tight truncate">
                      {song.track.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">
                      {song.track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveTrack(index, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveTrack(index, 'down');
                    }}
                    disabled={index === songs.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTrack(index);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {songs.length === 0 && (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No songs added. Search Spotify catalog to add songs.
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Spotify Search */}
        <div className="island-shell p-6 rounded-2xl flex flex-col h-full min-h-0">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4 shrink-0">
            Catalog Search
          </h2>
          <div className="relative mb-4 shrink-0">
            <input
              type="text"
              placeholder="Search tracks or artists..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                startTransition(() => { });
              }}
              className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-lagoon"
            />
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
          </div>

          {/* Virtualized Search List */}
          <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0 pr-1">
            {isSearching ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const track = searchResults[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="flex items-center justify-between py-2 border-b border-line"
                    >
                      <div className="flex items-center gap-3 truncate pr-2">
                        <div className="relative group shrink-0">
                          <img
                            src={track.coverArtUrl}
                            alt={track.title}
                            className="h-12 w-12 rounded-lg border border-line"
                          />
                          {track.previewUrl && (
                            <button
                              onClick={() =>
                                previewingTrackId === track.id
                                  ? stopPreview()
                                  : startPreview(track)
                              }
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-lg cursor-pointer"
                            >
                              {previewingTrackId === track.id ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-foreground text-xs leading-tight truncate">
                            {track.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground leading-tight truncate">
                            {track.artist}
                          </p>
                          <p className="text-[9px] text-muted-foreground/60 leading-none truncate mt-0.5">
                            {track.album}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddTrack(track)}
                        className="bg-lagoon hover:bg-lagoon-deep text-white p-2 rounded-xl active:scale-95 shrink-0 cursor-pointer"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No matching tracks found.
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-muted-foreground flex flex-col items-center">
                <Disc size={32} className="text-muted-foreground mb-2 opacity-30" />
                Type above to query songs.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Song Settings Editor */}
        <div className="island-shell p-6 rounded-2xl flex flex-col h-full min-h-0 justify-between">
          <div className="h-full flex flex-col min-h-0">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4 shrink-0">
              Song Settings
            </h2>

            {selectedSong ? (
              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                {/* Track Card */}
                <div className="flex items-center gap-4 p-4 bg-foam/10 border border-line rounded-2xl">
                  <img
                    src={selectedSong.track.coverArtUrl}
                    alt={selectedSong.track.title}
                    className="h-16 w-16 rounded-xl border border-line shrink-0"
                  />
                  <div className="truncate">
                    <h3 className="font-bold text-foreground text-sm leading-tight truncate mb-1">
                      {selectedSong.track.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-tight truncate">
                      {selectedSong.track.artist}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 leading-none truncate mt-1">
                      {selectedSong.track.album}
                    </p>
                  </div>
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Question Type
                  </label>
                  <select
                    value={selectedSong.questionType}
                    onChange={(e) =>
                      handleSongChange(
                        selectedSongIndex!,
                        'questionType',
                        e.target.value as any,
                      )
                    }
                    className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-lagoon"
                  >
                    <option value="TRACK_NAME">Identify Track Name</option>
                    <option value="ARTIST_NAME">Identify Artist Name</option>
                    <option value="FILL_IN_THE_GAP">Fill In The Gap (Lyrics)</option>
                  </select>
                </div>

                {/* Lyrics Gap input if FILL_IN_THE_GAP */}
                {selectedSong.questionType === 'FILL_IN_THE_GAP' && (
                  <div className="rise-in">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Lyrics Gap Target Phrase
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Never mind, I'll find"
                      value={selectedSong.lyricsGap || ''}
                      onChange={(e) =>
                        handleSongChange(
                          selectedSongIndex!,
                          'lyricsGap',
                          e.target.value,
                        )
                      }
                      className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-lagoon"
                    />
                  </div>
                )}

                {/* Offsets settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Start Offset (ms)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={selectedSong.start_offset_ms}
                      onChange={(e) =>
                        handleSongChange(
                          selectedSongIndex!,
                          'start_offset_ms',
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-lagoon"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      End Offset (ms)
                    </label>
                    <input
                      type="number"
                      min={1000}
                      value={selectedSong.end_offset_ms}
                      onChange={(e) =>
                        handleSongChange(
                          selectedSongIndex!,
                          'end_offset_ms',
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-lagoon"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground/60 leading-normal">
                  The snippet duration will be{' '}
                  <span className="font-bold text-foreground">
                    {((selectedSong.end_offset_ms - selectedSong.start_offset_ms) / 1000).toFixed(1)}
                  </span>{' '}
                  seconds. Use previews in search to determine timing.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
                <Music size={32} className="opacity-30 mb-2" />
                Select an added track on the left to configure offsets.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
