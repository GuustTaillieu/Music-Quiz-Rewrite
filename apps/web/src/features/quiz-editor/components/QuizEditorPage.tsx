import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Check, Music, Play, Pause } from 'lucide-react';
import { useQuizEditorController } from '../hooks/useQuizEditorController';
import { useSpotifyPlayer } from '#/features/audio-player/hooks/useSpotifyPlayer';
import { useGlobalVolume } from '#/features/audio-player/hooks/useGlobalVolume';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import { QuizSongList } from './QuizSongList';
import { QuestionTypeConfig } from './QuestionTypeConfig';
import { TimelineSlider } from './TimelineSlider';
import { LyricsGapEditor } from './LyricsGapEditor';
import { TrackCatalogSearch } from './TrackCatalogSearch';
import { EDITOR_CONSTANTS } from '../constants/editorConstants';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';

interface QuizEditorPageProps {
  quizId: string;
}

export function QuizEditorPage({ quizId }: QuizEditorPageProps) {
  const {
    navigate,
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
    parentRef,
    searchResults,
    isSearching,
    saveMutation,
    rowVirtualizer,
    handleAddTrack,
    handleRemoveTrack,
    handleSongChange,
    handleReorderSongs,
    startTransition,
    showSavedSuccess,
    handleRemoveTrackById,
    selectedSong,
  } = useQuizEditorController(quizId);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const spotifyPlayer = useSpotifyPlayer(true);
  const [globalVolume] = useGlobalVolume();
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    spotifyPlayer.setVolume(globalVolume);
  }, [globalVolume, spotifyPlayer.deviceId]);

  useEffect(() => {
    stopAudioPreview();
  }, [selectedSongIndex]);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  const playAudioPreview = () => {
    if (!selectedSong) return;
    if (!spotifyPlayer.deviceId) {
      alert(EDITOR_CONSTANTS.ERRORS.SPOTIFY_SDK_NOT_READY);
      return;
    }

    stopAudioPreview();

    const startOffset = selectedSong.start_offset_ms || EDITOR_CONSTANTS.DEFAULT_START_OFFSET_MS;
    const endOffset = selectedSong.end_offset_ms || EDITOR_CONSTANTS.DEFAULT_END_OFFSET_MS;

    spotifyPlayer.playTrack(selectedSong.spotifyTrackId, startOffset);
    setIsPlayingPreview(true);
    setCurrentPlaybackMs(startOffset);

    const checkInterval = EDITOR_CONSTANTS.PREVIEW_CHECK_INTERVAL_MS;
    let elapsed = 0;
    playbackTimerRef.current = setInterval(() => {
      elapsed += checkInterval;
      const currentMs = startOffset + elapsed;
      setCurrentPlaybackMs(currentMs);

      if (currentMs >= endOffset) {
        stopAudioPreview();
      }
    }, checkInterval);
  };

  const stopAudioPreview = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    spotifyPlayer.pauseTrack();
    setIsPlayingPreview(false);
    setCurrentPlaybackMs(null);
  };

  if (isSessionLoading || isQuizLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#05070f] text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent"></div>
        <p className="text-xs text-cyan-400 font-bold animate-pulse">Loading Studio Workspace...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen py-8 flex flex-col px-6 bg-[#05070f] text-white select-none">
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-45" />

      {/* Editor top toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10 z-10 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/' })}
            className="border border-cyan-500/20 text-cyan-400"
          >
            <ArrowLeft size={18} />
          </Button>

          <div className="flex flex-col flex-1 min-w-0 pr-4">
            <Input
              type="text"
              placeholder="Untitled Quiz Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-cyan-500/20 focus:border-[#00f0ff] focus:outline-none text-xl font-black text-white truncate max-w-md placeholder-cyan-500/20 py-0.5"
            />
            <Input
              type="text"
              placeholder="Add quiz descriptions here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-cyan-500/20 focus:border-[#00f0ff] focus:outline-none text-xs text-muted-foreground truncate max-w-lg mt-0.5 placeholder-cyan-500/10 py-0.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showSavedSuccess && (
            <Badge variant="spotify" className="flex items-center gap-1.5 px-3 py-2 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Check size={12} strokeWidth={3} /> Saved
            </Badge>
          )}

          <Button
            variant="emerald"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title.trim() || songs.length === 0}
          >
            <Save size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save Quiz'}
          </Button>
        </div>
      </div>

      {/* Main Studio Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0 z-10 relative">
        <QuizSongList
          songs={songs}
          selectedSongIndex={selectedSongIndex}
          setSelectedSongIndex={setSelectedSongIndex}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onRemoveTrack={handleRemoveTrack}
          onReorderSongs={handleReorderSongs}
        />

        <div className="lg:col-span-2 island-shell p-6 rounded-2xl flex flex-col h-[calc(100vh-170px)] min-h-0 bg-black/60 border border-cyan-500/10 glow-border-cyan backdrop-blur-xl">
          {selectedSong ? (
            <div className="flex flex-col h-full min-h-0 justify-between">
              <div className="flex items-center justify-between gap-4 p-4 bg-black/40 border border-cyan-500/10 rounded-2xl mb-4 shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={selectedSong.track.coverArtUrl}
                    alt="Album Cover"
                    className="h-14 w-14 rounded-xl border border-cyan-500/20 shadow-md shrink-0"
                  />
                  <div className="text-left min-w-0">
                    <h3 className="font-black text-white text-base leading-snug truncate">
                      {selectedSong.track.title}
                    </h3>
                    <p className="text-xs font-semibold text-cyan-400 truncate">
                      {selectedSong.track.artist}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">
                      Album: {selectedSong.track.album || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                <QuestionTypeConfig
                  questionType={selectedSong.questionType}
                  onChangeType={(type) =>
                    handleSongChange(selectedSongIndex!, 'questionType', type)
                  }
                />

                <div className="border-t border-cyan-500/5 pt-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Timeline Offsets & Crop
                    </label>
                    <Button
                      type="button"
                      variant={isPlayingPreview ? 'destructive' : 'cyan'}
                      size="sm"
                      onClick={isPlayingPreview ? stopAudioPreview : playAudioPreview}
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause size={10} /> Pause Snippet
                        </>
                      ) : (
                        <>
                          <Play size={10} fill="currentColor" /> Play Snippet
                        </>
                      )}
                    </Button>
                  </div>

                  <TimelineSlider
                    durationMs={selectedSong.track.durationMs || GAME_CONFIG.FALLBACK_SONG_DURATION_MS}
                    startOffsetMs={selectedSong.start_offset_ms}
                    endOffsetMs={selectedSong.end_offset_ms}
                    currentPlaybackMs={currentPlaybackMs}
                    onChange={(start, end) => {
                      handleSongChange(selectedSongIndex!, {
                        start_offset_ms: start,
                        end_offset_ms: end,
                      });
                    }}
                  />
                </div>

                {selectedSong.questionType === 'FILL_IN_THE_GAP' && (
                  <div className="text-left animate-slide-in">
                    <LyricsGapEditor
                      value={selectedSong.lyricsGap || ''}
                      onChange={(newVal) =>
                        handleSongChange(selectedSongIndex!, 'lyricsGap', newVal)
                      }
                      artist={selectedSong.track.artist}
                      title={selectedSong.track.title}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-muted-foreground select-none">
              <Music size={40} className="text-cyan-400 opacity-20 mb-3 animate-pulse" />
              <h4 className="font-bold text-white text-sm mb-1">No track selected</h4>
              <p className="max-w-xs leading-normal">
                Select an added song from the playlist column on the left to customize question
                categories, crop snippets, or edit lyrics.
              </p>
            </div>
          )}
        </div>
      </div>

      <TrackCatalogSearch
        isOpen={isSearchModalOpen}
        onClose={() => {
          stopAudioPreview();
          setIsSearchModalOpen(false);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startTransition={startTransition}
        songs={songs}
        handleAddTrack={handleAddTrack}
        handleRemoveTrackById={handleRemoveTrackById}
        parentRef={parentRef}
        isSearching={isSearching}
        searchResults={searchResults}
        rowVirtualizer={rowVirtualizer}
      />
    </div>
  );
}
