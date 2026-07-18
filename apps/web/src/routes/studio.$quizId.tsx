import { createFileRoute } from '@tanstack/react-router';
import { useQuizEditor } from '#/hooks/useQuizEditor';
import { TimelineSlider } from '#/components/TimelineSlider';
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

export const Route = createFileRoute('/studio/$quizId')({
  component: QuizEditor,
});

function QuizEditor() {
  const { quizId } = Route.useParams();
  const {
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
    startTransition,
  } = useQuizEditor(quizId);

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

  return (
    <div className="page-wrap min-h-screen py-12 flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Invisible Audio Element */}
      <audio ref={audioRef} onEnded={() => stopPreview()} />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-line shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => navigate({ to: '/studio' })}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foam/10 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col flex-1 min-w-0 pr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz Title"
              className="bg-transparent font-black text-foreground text-2xl outline-none focus:border-b focus:border-lagoon/40 border-b border-transparent leading-none w-full max-w-xl transition-all"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this quiz..."
              className="bg-transparent text-xs text-muted-foreground outline-none focus:border-b focus:border-lagoon/40 border-b border-transparent mt-1 w-full max-w-2xl transition-all"
            />
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !title.trim() || songs.length === 0}
          className="bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-2.5 px-5 rounded-xl hover:shadow-lg active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Save size={18} /> {saveMutation.isPending ? 'Saving...' : 'Save Quiz'}
        </button>
      </div>

      {/* Main Body Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0">
        {/* Left Column: Songs List */}
        <div className="island-shell p-6 rounded-2xl flex flex-col h-full min-h-0">
          <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4 shrink-0 flex justify-between items-center">
            <span>Quiz Tracks</span>
            <span className="bg-lagoon/10 text-lagoon font-black text-xs px-2.5 py-1 rounded-full">
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

                {/* Timeline Offset Slider */}
                <div className="pt-2">
                  <TimelineSlider
                    durationMs={selectedSong.track.durationMs || 180000}
                    startOffsetMs={selectedSong.start_offset_ms}
                    endOffsetMs={selectedSong.end_offset_ms}
                    onChange={(start, end) => {
                      handleSongChange(selectedSongIndex!, 'start_offset_ms', start);
                      handleSongChange(selectedSongIndex!, 'end_offset_ms', end);
                    }}
                  />
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
