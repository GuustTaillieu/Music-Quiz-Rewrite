import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save, Check, Music, Play, Pause, Share2, RefreshCcw, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { ButtonGroup, ButtonGroupSeparator } from '#/features/shared/components/ui/button-group';
import { useAudioPreview } from '#/features/audio-player';
import { useQuizQuery, useSaveQuizMutation, useSyncQuizMutation } from '#/features/quiz-core';
import { QuizTitleInput, QuizDescriptionInput } from '#/features/quiz-metadata-editor';
import { QuizSongList, QuestionTypeConfig, AcceptedAnswersModal, generateAnswerSuggestions } from '#/features/question-authoring';
import { TimelineSlider } from '#/features/timeline-trimmer';
import { LyricsGapEditor } from '#/features/lyrics-gap-builder';
import { TrackCatalogSearch } from '#/features/track-search';
import { ShareQuizModal, SyncSummaryModal } from '#/features/quiz-forking';
import { AiStudioAssistantModal } from '#/features/ai-quiz';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import type { QuizSong, SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

interface QuizEditorPageProps {
  quizId: string;
}

export function QuizEditorPage({ quizId }: QuizEditorPageProps) {
  const navigate = useNavigate();

  const { data: quiz, isLoading, refetch: refetchQuiz } = useQuizQuery(quizId);
  const saveQuizMutation = useSaveQuizMutation(quizId);
  const syncQuizMutation = useSyncQuizMutation(quizId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [songs, setSongs] = useState<QuizSong[]>([]);
  const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAcceptedModalOpen, setIsAcceptedModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title || '');
      setDescription(quiz.description || '');
      setSongs(quiz.songs || []);
      if (quiz.songs && quiz.songs.length > 0 && selectedSongIndex === null) {
        setSelectedSongIndex(0);
      }
    }
  }, [quiz]);

  const handleSave = async () => {
    try {
      await saveQuizMutation.mutateAsync({ title, description, songs });
      setShowSavedSuccess(true);
      setTimeout(() => setShowSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save quiz');
    }
  };

  const handleSync = async () => {
    if (!quiz?.forkedFromQuizId) return;
    try {
      const res = await syncQuizMutation.mutateAsync();
      setSyncResult(res);
      refetchQuiz();
    } catch (err: any) {
      alert(err.message || 'Failed to sync quiz');
    }
  };

  const handleAddTrack = (track: SpotifyTrack) => {
    const autoTitles = generateAnswerSuggestions(track.title);
    const autoArtists = generateAnswerSuggestions(track.artist);

    const newSong: QuizSong = {
      id: `temp-${Date.now()}-${Math.random()}`,
      spotifyTrackId: track.id,
      track,
      questionType: 'TRACK_NAME',
      start_offset_ms: 0,
      end_offset_ms: Math.min(GAME_CONFIG.DEFAULT_SNIPPET_WINDOW_MS, track.durationMs || GAME_CONFIG.FALLBACK_SONG_DURATION_MS),
      acceptedTitles: autoTitles,
      acceptedArtists: autoArtists,
    };
    const nextSongs = [...songs, newSong];
    setSongs(nextSongs);
    setSelectedSongIndex(nextSongs.length - 1);
  };

  const handleRemoveTrack = (index: number) => {
    const nextSongs = songs.filter((_, i) => i !== index);
    setSongs(nextSongs);
    if (selectedSongIndex === index) {
      setSelectedSongIndex(nextSongs.length > 0 ? 0 : null);
    } else if (selectedSongIndex !== null && selectedSongIndex > index) {
      setSelectedSongIndex(selectedSongIndex - 1);
    }
  };

  const handleRemoveTrackById = (spotifyTrackId: string) => {
    const idx = songs.findIndex((s) => s.spotifyTrackId === spotifyTrackId);
    if (idx !== -1) handleRemoveTrack(idx);
  };

  const handleSongChange = (index: number, keyOrObject: any, value?: any) => {
    const nextSongs = [...songs];
    if (typeof keyOrObject === 'string') {
      nextSongs[index] = { ...nextSongs[index], [keyOrObject]: value };
    } else {
      nextSongs[index] = { ...nextSongs[index], ...keyOrObject };
    }
    setSongs(nextSongs);
  };

  const selectedSong =
    selectedSongIndex !== null && songs[selectedSongIndex]
      ? songs[selectedSongIndex]
      : null;

  let acceptedFieldLabel = 'Track Title';
  let defaultAnswerText = selectedSong?.track.title || '';
  let currentAcceptedList: string[] = selectedSong?.acceptedTitles || [];
  let savePropKey: 'acceptedTitles' | 'acceptedArtists' | 'acceptedLyricsGaps' = 'acceptedTitles';

  if (selectedSong?.questionType === 'ARTIST_NAME') {
    acceptedFieldLabel = 'Artist Name';
    defaultAnswerText = selectedSong.track.artist;
    currentAcceptedList = selectedSong.acceptedArtists || [];
    savePropKey = 'acceptedArtists';
  } else if (selectedSong?.questionType === 'FILL_IN_THE_GAP') {
    acceptedFieldLabel = 'Lyrics Gap';
    defaultAnswerText = selectedSong.lyricsGap || '';
    currentAcceptedList = selectedSong.acceptedLyricsGaps || [];
    savePropKey = 'acceptedLyricsGaps';
  }

  const {
    currentPlaybackMs,
    isPlayingPreview,
    playAudioPreview,
    stopAudioPreview,
  } = useAudioPreview(selectedSong);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#05070f] text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent" />
        <p className="text-xs text-cyan-400 font-bold animate-pulse">Loading Studio Workspace...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen py-8 flex flex-col px-6 bg-[#05070f] text-white select-none">
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-45" />

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/10 z-10 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/' })}
            className="border border-cyan-500/20 text-cyan-400 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </Button>

          <div className="flex flex-col flex-1 w-0 pr-4">
            <QuizTitleInput
              title={title}
              onChangeTitle={setTitle}
              forkedFromCreator={quiz?.forkedFrom?.creatorName}
            />
            <QuizDescriptionInput
              description={description}
              onChangeDescription={setDescription}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showSavedSuccess && (
            <Badge variant="spotify" className="flex items-center gap-1.5 px-3 py-2 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Check size={12} strokeWidth={3} /> Saved
            </Badge>
          )}

          {quiz?.forkedFromQuizId && (
            <Button
              variant="emerald_inverted"
              size="sm"
              disabled={syncQuizMutation.isPending}
              onClick={handleSync}
            >
              <RefreshCcw size={12} /> Sync Upstream
            </Button>
          )}

          <ButtonGroup>
            <Button
              variant="emerald"
              size="sm"
              onClick={handleSave}
              disabled={saveQuizMutation.isPending || title.trim().length < 2 || songs.length === 0}
            >
              <Save size={12} /> {saveQuizMutation.isPending ? 'Saving...' : 'Save Quiz'}
            </Button>
            <ButtonGroupSeparator />
            <Button variant="emerald" size="sm" onClick={() => setIsShareModalOpen(true)}>
              <Share2 size={12} />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0 z-10 relative">
        <QuizSongList
          songs={songs}
          selectedSongIndex={selectedSongIndex}
          setSelectedSongIndex={setSelectedSongIndex}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          onRemoveTrack={handleRemoveTrack}
          onReorderSongs={(startIndex, endIndex) => {
            const result = Array.from(songs);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            setSongs(result);
          }}
        />

        <div className="lg:col-span-2 island-shell p-6 rounded-2xl flex flex-col h-[calc(100vh-170px)] min-h-0 bg-black/60 border border-cyan-500/10 glow-border-cyan backdrop-blur-xl">
          {selectedSong ? (
            <div className="flex flex-col h-full min-h-0 justify-between">
              <div className="flex items-center justify-between gap-4 p-4 bg-black/40 border border-cyan-500/10 rounded-2xl mb-4 shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={selectedSong.track.coverArtUrl}
                    alt="Album Cover"
                    className="h-14 w-14 rounded-xl border border-cyan-500/20 shadow-md shrink-0 object-cover"
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

                <div className="bg-black/40 border border-cyan-500/10 rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-[#00f0ff]" />
                      Accepted Variations ({currentAcceptedList.length})
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      {currentAcceptedList.length > 0
                        ? `${currentAcceptedList.length} custom answer variations accepted.`
                        : `Target: "${defaultAnswerText || 'N/A'}". Add alternative accepted answers.`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAcceptedModalOpen(true)}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer text-xs font-bold gap-1.5 shrink-0"
                  >
                    <SlidersHorizontal size={13} /> Manage Answers
                  </Button>
                </div>

                <AcceptedAnswersModal
                  isOpen={isAcceptedModalOpen}
                  onClose={() => setIsAcceptedModalOpen(false)}
                  fieldLabel={acceptedFieldLabel}
                  defaultAnswer={defaultAnswerText}
                  acceptedAnswers={currentAcceptedList}
                  onSave={(updated) =>
                    handleSongChange(selectedSongIndex!, savePropKey, updated)
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
          setIsSearchModalOpen(false);
        }}
        songs={songs}
        handleAddTrack={handleAddTrack}
        handleRemoveTrackById={handleRemoveTrackById}
      />

      <AiStudioAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        quizId={quizId}
        onAddSongs={(newSongs) => {
          setSongs((prev) => [...prev, ...newSongs]);
        }}
      />

      <ShareQuizModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizId={quizId}
        quizTitle={title}
      />

      {syncResult && (
        <SyncSummaryModal
          isOpen={Boolean(syncResult)}
          onClose={() => setSyncResult(null)}
          addedCount={syncResult.addedCount}
          updatedCount={syncResult.updatedCount}
          preservedCount={syncResult.preservedCount}
        />
      )}
    </div>
  );
}
