import { createFileRoute } from '@tanstack/react-router';
import { useQuizEditor } from '#/hooks/useQuizEditor';
import { useSpotifyPlayer } from '#/hooks/useSpotifyPlayer';
import { useGlobalVolume } from '#/hooks/useGlobalVolume';
import { TimelineSlider } from '#/components/TimelineSlider';
import { LyricsGapEditor } from '#/components/LyricsGapEditor';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  Search,
  Plus,
  Trash2,
  Play,
  Pause,
  Disc,
  Music,
  X,
  GripVertical,
  Check,
} from 'lucide-react';
import type { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

const SAMPLE_TRACKS: SpotifyTrack[] = [
  {
    id: 'track-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b2738863d6e38f6c1119c901cc60',
    durationMs: 200000,
    previewUrl: 'https://p.scdn.co/mp3-preview/b695e0c5d5f2a9675276e053a479ff6844966cb7',
  },
  {
    id: 'track-2',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: 'Divide',
    coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4962d6994ec38ee5',
    durationMs: 233000,
    previewUrl: 'https://p.scdn.co/mp3-preview/c873f274719c8f0e57dfc2a6886e3f49c0d38101',
  },
  {
    id: 'track-3',
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21',
    coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b273211516abdf4ffed863a0e10b',
    durationMs: 285000,
    previewUrl: 'https://p.scdn.co/mp3-preview/12cb348f95c479ff73a90a424269e98d9cc9b6c0',
  },
];

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
  } = useQuizEditor(quizId);

  // Studio Modal & Preview States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Spotify SDK Playback for Host to preview actual song snippet
  const spotifyPlayer = useSpotifyPlayer(true);
  const [globalVolume] = useGlobalVolume();
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    spotifyPlayer.setVolume(globalVolume);
  }, [globalVolume, spotifyPlayer.deviceId]);

  const selectedSong =
    selectedSongIndex !== null && selectedSongIndex < songs.length
      ? songs[selectedSongIndex]
      : null;

  // Sync / Stop Audio when selected song changes
  useEffect(() => {
    stopAudioPreview();
  }, [selectedSongIndex]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  const playAudioPreview = () => {
    if (!selectedSong) return;
    if (!spotifyPlayer.deviceId) {
      alert("Spotify Web Player is not ready. Please make sure your Spotify app is open and playing to activate the device 'Spotify Music Quiz Board'.");
      return;
    }

    // Stop any active previews first
    stopAudioPreview();

    const startOffset = selectedSong.start_offset_ms || 0;
    const endOffset = selectedSong.end_offset_ms || 30000;

    spotifyPlayer.playTrack(selectedSong.spotifyTrackId, startOffset);
    setIsPlayingPreview(true);
    setCurrentPlaybackMs(startOffset);

    const checkInterval = 100;
    let elapsed = 0;
    playbackTimerRef.current = setInterval(() => {
      elapsed += checkInterval;
      const currentMs = startOffset + elapsed;
      setCurrentPlaybackMs(currentMs);

      // Auto-pause when snippet end offset boundary is reached
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
          <button
            onClick={() => navigate({ to: '/' })}
            className="p-2 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/5 text-cyan-400 cursor-pointer transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex flex-col flex-1 min-w-0 pr-4">
            <input
              type="text"
              placeholder="Untitled Quiz Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-cyan-500/20 focus:border-[#00f0ff] focus:outline-none text-xl font-black text-white truncate max-w-md placeholder-cyan-500/20 py-0.5"
            />
            <input
              type="text"
              placeholder="Add quiz descriptions here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-cyan-500/20 focus:border-[#00f0ff] focus:outline-none text-xs text-muted-foreground truncate max-w-lg mt-0.5 placeholder-cyan-500/10 py-0.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Saved Notification Banner */}
          {showSavedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-xl animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Check size={12} strokeWidth={3} /> Saved
            </div>
          )}

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title.trim() || songs.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] text-black font-black uppercase tracking-wider py-2.5 px-5 rounded-xl active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 border border-emerald-400/20 transition-all text-xs"
          >
            <Save size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>

      {/* Main Studio Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0 z-10 relative">

        {/* Left Column: Playlist Editor (Width 1/3) */}
        <div className="lg:col-span-1 island-shell p-6 rounded-2xl flex flex-col h-[calc(100vh-170px)] min-h-0 bg-black/60 border border-cyan-500/10 glow-border-cyan backdrop-blur-xl">

          <div className="flex items-center justify-between shrink-0 mb-4 pb-2 border-b border-cyan-500/5">
            <h3 className="font-black text-pink-400 text-xs uppercase tracking-wider">
              Quiz Tracks ({songs.length})
            </h3>

            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00f0ff] border border-cyan-500/30 rounded-xl px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
            >
              <Plus size={12} /> Add Tracks
            </button>
          </div>

          {/* Draggable scroll list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 select-none">
            {songs.map((song, index) => (
              <div
                key={index}
                onClick={() => setSelectedSongIndex(index)}
                draggable
                onDragStart={(e) => {
                  setDraggedIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== index) {
                    handleReorderSongs(draggedIndex, index);
                    setDraggedIndex(index);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDraggedIndex(null);
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-grab transition-all ${selectedSongIndex === index
                  ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-bold'
                  : 'border-cyan-500/10 bg-black/30 hover:border-cyan-500/25'
                  } ${draggedIndex === index ? 'opacity-40 scale-95 border-dashed border-cyan-400 bg-cyan-500/5' : ''}`}
              >
                <div className="flex items-center gap-3 truncate pr-2">
                  <div className="text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing hover:text-cyan-400">
                    <GripVertical size={14} />
                  </div>
                  <img
                    src={song.track.coverArtUrl}
                    alt={song.track.title}
                    className="h-8 w-8 rounded-lg border border-cyan-500/10 shrink-0"
                  />
                  <div className="truncate text-left">
                    <h4 className="font-bold text-foreground text-xs leading-tight truncate">
                      {song.track.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-tight truncate">
                      {song.track.artist}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTrack(index);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                  title="Remove Song"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {songs.length === 0 && (
              <div className="text-center py-16 text-xs text-muted-foreground">
                No songs added. Click <strong>Add Tracks</strong> above to search and populate your music quiz catalog.
              </div>
            )}
          </div>
        </div>

        {/* Right Workspace: Selected Track Settings Panel (Width 2/3) */}
        <div className="lg:col-span-2 island-shell p-6 rounded-2xl flex flex-col h-[calc(100vh-170px)] min-h-0 bg-black/60 border border-cyan-500/10 glow-border-cyan backdrop-blur-xl">

          {selectedSong ? (
            <div className="flex flex-col h-full min-h-0 justify-between">

              {/* Header track card */}
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

              {/* Settings body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">

                {/* Question Type selection pills */}
                <div className="text-left">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
                    Guesser Question Type
                  </label>
                  
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                    {[
                      { id: 'TRACK_NAME', label: 'Guess Track Name' },
                      { id: 'ARTIST_NAME', label: 'Guess Artist' },
                      { id: 'FILL_IN_THE_GAP', label: 'Fill in the Lyrics' },
                    ].map((opt) => {
                      const isSel = selectedSong.questionType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            handleSongChange(
                              selectedSongIndex!,
                              'questionType',
                              opt.id as any,
                            )
                          }
                          className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                            isSel
                              ? 'bg-cyan-500/20 border-cyan-400 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                              : 'bg-black/30 border-cyan-500/10 text-muted-foreground hover:text-white hover:border-cyan-500/25'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
                    Choose what detail players must guess. Track and artist names will automatically hide based on this selector.
                  </p>
                </div>

                {/* Timeline slider control & Preview Play */}
                <div className="border-t border-cyan-500/5 pt-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Timeline Offsets & Crop
                    </label>
                    <button
                      type="button"
                      onClick={isPlayingPreview ? stopAudioPreview : playAudioPreview}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        isPlayingPreview
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 hover:bg-rose-500/30'
                          : 'bg-[#00f0ff]/10 border-cyan-500/30 text-[#00f0ff] hover:bg-[#00f0ff]/20'
                      }`}
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
                    </button>
                  </div>

                  <TimelineSlider
                    durationMs={selectedSong.track.durationMs || 180000}
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

                {/* Lyrics Gap Editor (Visible only when GAP lyrics selected) */}
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
              <p className="max-w-xs leading-normal">Select an added song from the playlist column on the left to customize question categories, crop snippets, or edit lyrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Track Search Overlay Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-[#0b0e17] border border-cyan-500/20 max-w-2xl w-full h-[85vh] rounded-3xl p-6 shadow-2xl relative flex flex-col">

            {/* Modal Close */}
            <button
              onClick={() => {
                stopAudioPreview();
                setIsSearchModalOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-white mb-1 text-left">Search Spotify Music</h3>
            <p className="text-xs text-muted-foreground mb-4 text-left">
              Query track titles or artists to include them in this quiz. Added songs will populate in the editor list.
            </p>

            {/* Search inputs */}
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
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]"
              />
              <Search className="absolute left-3 top-3 text-[#00f0ff]" size={16} />
            </div>

            {/* Quick Testing Samples */}
            <div className="mb-4 shrink-0 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-left">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-[#00f0ff] mb-2 flex items-center gap-1">
                <Music size={10} /> Quick Add Sample Songs
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SAMPLE_TRACKS.map((track) => {
                  const isAdded = songs.some((s) => s.spotifyTrackId === track.id);
                  return (
                    <div
                      key={track.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-cyan-500/20 rounded-lg text-left truncate relative"
                    >
                      <img src={track.coverArtUrl} className="h-6 w-6 rounded border border-cyan-500/10 shrink-0 object-cover" />
                      <div className="truncate text-[10px] mr-2">
                        <p className="font-bold text-white truncate max-w-[80px] leading-tight">{track.title}</p>
                        <p className="text-muted-foreground truncate max-w-[80px] leading-none">{track.artist}</p>
                      </div>
                      {isAdded ? (
                        <button
                          onClick={() => handleRemoveTrackById(track.id)}
                          className="bg-cyan-500 text-black p-1 rounded-full cursor-pointer transition-all"
                        >
                          <Check size={8} strokeWidth={3} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddTrack(track)}
                          className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black p-1 rounded-full border border-cyan-500/25 cursor-pointer transition-all"
                        >
                          <Plus size={8} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Virtualized Search List */}
            <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0 pr-1 border border-cyan-500/10 rounded-2xl bg-black/20 p-3">
              {isSearching ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#00f0ff] border-t-transparent"></div>
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
                    const isAdded = songs.some((s) => s.spotifyTrackId === track.id);
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
                        className="flex items-center justify-between py-2 border-b border-cyan-500/5 text-left"
                      >
                        <div className="flex items-center gap-3 truncate pr-2">
                          <img
                            src={track.coverArtUrl}
                            alt={track.title}
                            className="h-10 w-10 rounded-lg border border-cyan-500/10 shrink-0 object-cover"
                          />
                          <div className="truncate">
                            <h4 className="font-bold text-foreground text-xs leading-tight truncate">
                              {track.title}
                            </h4>
                            <p className="text-[10px] text-muted-foreground leading-tight truncate">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        {isAdded ? (
                          <button
                            onClick={() => handleRemoveTrackById(track.id)}
                            className="bg-cyan-500 text-black p-2 rounded-full hover:scale-105 active:scale-95 shrink-0 cursor-pointer transition-all flex items-center justify-center h-8 w-8 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                            title="Remove Song"
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddTrack(track)}
                            className="bg-cyan-500/10 border border-cyan-500/35 text-cyan-400 hover:bg-cyan-500 hover:text-black p-2 rounded-full hover:scale-105 active:scale-95 shrink-0 cursor-pointer transition-all flex items-center justify-center h-8 w-8"
                            title="Add Song"
                          >
                            <Plus size={14} />
                          </button>
                        )}
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
                  <Disc size={32} className="text-cyan-400 mb-2 opacity-30 animate-pulse" />
                  Type in search bar to query Spotify catalog.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
