import { useState } from 'react';
import { ArrowLeft, Save, Check, Music, Play, Pause, Share2, RefreshCcw, GitFork } from 'lucide-react';
import { useQuizEditorController } from '../hooks/useQuizEditorController';
import { useAudioPreview } from '#/features/audio-player/hooks/useAudioPreview';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import { QuizSongList } from './QuizSongList';
import { QuestionTypeConfig } from './QuestionTypeConfig';
import { TimelineSlider } from './TimelineSlider';
import { LyricsGapEditor } from './LyricsGapEditor';
import { TrackCatalogSearch } from './TrackCatalogSearch';
import { ShareQuizModal } from '#/features/dashboard/components/ShareQuizModal';
import { SyncSummaryModal } from '#/features/dashboard/components/SyncSummaryModal';
import { editorService } from '../api/editorService';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import { ButtonGroup, ButtonGroupSeparator } from '#/features/shared/components/ui/button-group';

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
    loadedQuiz,
    refetchQuiz,
  } = useQuizEditorController(quizId);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!loadedQuiz?.forkedFromQuizId) return;
    try {
      setIsSyncing(true);
      const res = await editorService.syncQuiz(quizId);
      setSyncResult(res);
      refetchQuiz();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const {
    currentPlaybackMs,
    isPlayingPreview,
    playAudioPreview,
    stopAudioPreview,
  } = useAudioPreview(selectedSong);

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

          <div className="flex flex-col flex-1 w-0 pr-4">
            <div className="flex items-center gap-2 max-w-full">
              <div className="inline-grid items-center min-w-[120px] max-w-xs sm:max-w-md md:max-w-lg">
                <span className="col-start-1 row-start-1 invisible whitespace-pre text-xl font-black px-3 py-0.5 pointer-events-none truncate">
                  {title || 'Untitled Quiz Title...'}
                </span>
                <Input
                  type="text"
                  placeholder="Untitled Quiz Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-start-1 row-start-1 w-full bg-transparent border-b border-transparent hover:border-cyan-500/20 focus:border-[#00f0ff] focus:outline-none text-xl font-black text-white placeholder-cyan-500/20 py-0.5 truncate"
                />
              </div>
              {loadedQuiz?.forkedFrom && (
                <Badge variant="magenta" className="text-[8px] py-0.5 px-2 font-bold shrink-0">
                  <GitFork size={10} className='mr-1' /> @{loadedQuiz.forkedFrom.creatorName}
                </Badge>
              )}
            </div>
            {title.length > 0 && title.trim().length < 2 && (
              <p className="text-[10px] text-rose-400 font-bold mt-0.5">
                Title must be at least 2 characters long.
              </p>
            )}
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

          {loadedQuiz?.forkedFromQuizId && (
            <Button
              variant="emerald_inverted"
              size="sm"
              disabled={isSyncing}
              onClick={handleSync}
            >
              <RefreshCcw size={12} />
              Sync Upstream
            </Button>
          )}

          <ButtonGroup>
            <Button
              variant="emerald"
              size='sm'
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || title.trim().length < 2 || songs.length === 0}
            >
              <Save size={12} /> {saveMutation.isPending ? 'Saving...' : 'Save Quiz'}
            </Button>
            <ButtonGroupSeparator />
            <Button
              variant='emerald'
              size='sm'
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 size={12} />
            </Button>
          </ButtonGroup>
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
                  <div className="flex justify-end mb-2">
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

      <ShareQuizModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizId={quizId}
        quizTitle={title}
      />

      <SyncSummaryModal
        isOpen={Boolean(syncResult)}
        onClose={() => setSyncResult(null)}
        syncResult={syncResult}
        quizTitle={title}
      />
    </div>
  );
}
