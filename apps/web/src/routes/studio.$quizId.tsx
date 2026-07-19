import { createFileRoute } from '@tanstack/react-router';
import { useQuizEditor } from '#/hooks/useQuizEditor';
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
} from 'lucide-react';
import type { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

const SAMPLE_TRACKS: SpotifyTrack[] = [
  {
    id: 'track-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b0400eb907',
    previewUrl: 'https://p.scdn.co/mp3-preview/5f6687a19eec032025078b84b84a3070f1a51b5e',
    durationMs: 200000,
  },
  {
    id: 'track-2',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede130bc0c9435b3c4ee',
    previewUrl: 'https://p.scdn.co/mp3-preview/a90326442646c0757a3e74ffc18683526017cfbf',
    durationMs: 203000,
  },
  {
    id: 'track-3',
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21',
    coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b27321124a1ee5d9abf54f43c4f6',
    previewUrl: 'https://p.scdn.co/mp3-preview/a90326442646c0757a3e74ffc18683526017cfbf',
    durationMs: 285000,
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
  } = useQuizEditor(quizId);

  // Studio Modal & Preview States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // HTML5 audio preview logic matching timeline slider
  const editorAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!selectedSong || !selectedSong.track.previewUrl || !editorAudioRef.current) return;
    
    // Stop any active previews first
    stopAudioPreview();

    editorAudioRef.current.src = selectedSong.track.previewUrl;
    
    // Fallback URL only supports 30 seconds. Bounds offsets.
    const startSec = (selectedSong.start_offset_ms || 0) / 1000;
    editorAudioRef.current.currentTime = startSec >= 30 ? 0 : startSec;
    
    editorAudioRef.current.play().then(() => {
      setIsPlayingPreview(true);
      setCurrentPlaybackMs(editorAudioRef.current!.currentTime * 1000);

      playbackTimerRef.current = setInterval(() => {
        if (!editorAudioRef.current) return;
        const currentMs = editorAudioRef.current.currentTime * 1000;
        
        setCurrentPlaybackMs(currentMs);

        // Auto-pause when snippet end offset boundary is reached
        if (currentMs >= selectedSong.end_offset_ms || editorAudioRef.current.ended) {
          stopAudioPreview();
        }
      }, 50);
    }).catch((err) => {
      console.warn('Playback block:', err);
    });
  };

  const stopAudioPreview = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (editorAudioRef.current) {
      editorAudioRef.current.pause();
    }
    setIsPlayingPreview(false);
    setCurrentPlaybackMs(null);
  };

  if (isSessionLoading || isQuizLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  if (!sessionData?.user) {
    navigate({ to: '/' });
    return null;
  }

  return (
    <div className="relative w-full h-screen max-h-screen overflow-hidden flex flex-col px-6 py-6 bg-[#05070f] text-white">
      {/* Synthwave backdrop */}
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-40" />

      {/* HTML5 Audio Preview Link */}
      <audio ref={editorAudioRef} onEnded={stopAudioPreview} />

      {/* Editor Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/10 shrink-0 z-10 relative">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => navigate({ to: '/' })}
            className="p-2 text-cyan-400 hover:text-[#00f0ff] rounded-xl hover:bg-cyan-500/10 transition-all shrink-0 cursor-pointer border border-cyan-500/10"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex flex-col flex-1 min-w-0 pr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz Title"
              className="bg-transparent font-black text-[#00f0ff] glow-text-cyan text-xl outline-none focus:border-b focus:border-cyan-400 border-b border-transparent leading-none w-full max-w-xl transition-all"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add quiz description here..."
              className="bg-transparent text-xs text-muted-foreground outline-none focus:border-b focus:border-cyan-400 border-b border-transparent mt-1.5 w-full max-w-2xl transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !title.trim() || songs.length === 0}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] text-black font-black uppercase tracking-wider py-2.5 px-5 rounded-xl active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 border border-emerald-400/20 transition-all text-xs"
        >
          <Save size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save Quiz'}
        </button>
      </div>

      {/* Main Studio Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-0 z-10 relative">
        
        {/* Left Column: Playlist Editor (Width 1/3) */}
        <div className="lg:col-span-1 island-shell p-6 rounded-2xl flex flex-col h-full min-h-0 bg-black/60 border border-cyan-500/10 glow-border-cyan backdrop-blur-xl">
          
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
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== index) {
                    handleReorderSongs(draggedIndex, index);
                  }
                  setDraggedIndex(null);
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-grab transition-all ${
                  selectedSongIndex === index
                    ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-bold'
                    : 'border-cyan-500/10 bg-black/30 hover:border-cyan-500/25'
                } ${draggedIndex === index ? 'opacity-40 scale-95 border-dashed border-cyan-400' : ''}`}
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
                  className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer shrink-0"
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
        <div className="lg:col-span-2 island-shell p-6 rounded-2xl flex flex-col h-full min-h-0 bg-black/60 border border-cyan-500/10 glow-border-cyan backdrop-blur-xl">
          
          {selectedSong ? (
            <div className="flex flex-col h-full min-h-0 justify-between">
              
              {/* Header track card */}
              <div className="flex items-center justify-between gap-4 p-4 bg-black/40 border border-cyan-500/10 rounded-2xl mb-4 shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={selectedSong.track.coverArtUrl}
                    alt={selectedSong.track.title}
                    className="h-16 w-16 rounded-xl border border-cyan-500/20 shadow-md shrink-0"
                  />
                  <div className="min-w-0 text-left">
                    <span className="text-[9px] text-[#00f0ff] uppercase tracking-wider font-black glow-text-cyan">Configuring track {selectedSongIndex! + 1} of {songs.length}</span>
                    <h3 className="font-black text-white text-lg leading-tight truncate mt-0.5">
                      {selectedSong.track.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate leading-normal">
                      {selectedSong.track.artist} &bull; {selectedSong.track.album}
                    </p>
                  </div>
                </div>

                {/* Local Playback Preview Control */}
                {selectedSong.track.previewUrl ? (
                  <button
                    onClick={isPlayingPreview ? stopAudioPreview : playAudioPreview}
                    className={`h-11 w-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 border ${
                      isPlayingPreview
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-500'
                        : 'bg-[#00f0ff]/10 border-cyan-500/40 text-[#00f0ff] hover:bg-[#00f0ff]/20'
                    }`}
                  >
                    {isPlayingPreview ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  </button>
                ) : (
                  <span className="text-[10px] text-muted-foreground uppercase border border-cyan-500/5 bg-black/20 rounded-xl px-2.5 py-1">No preview URL</span>
                )}
              </div>

              {/* Settings body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                
                {/* Question Type selection */}
                <div className="text-left">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
                    Round Question Type
                  </label>
                  <select
                    value={selectedSong.questionType}
                    onChange={(e) =>
                      handleSongChange(selectedSongIndex!, 'questionType', e.target.value as any)
                    }
                    className="w-full sm:w-72 bg-black/40 border border-cyan-500/20 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#00f0ff]"
                  >
                    <option value="TRACK_NAME">Identify Track Name</option>
                    <option value="ARTIST_NAME">Identify Artist Name</option>
                    <option value="FILL_IN_THE_GAP">Fill-In-The-Gap Lyrics</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
                    Choose what detail players must guess. Track and artist names will automatically hide based on this selector.
                  </p>
                </div>

                {/* Lyrics Gap Editor (Visible only when GAP lyrics selected) */}
                {selectedSong.questionType === 'FILL_IN_THE_GAP' && (
                  <div className="text-left animate-slide-in">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
                      Lyrics Gap Editor (Monospace click-to-hide)
                    </label>
                    <LyricsGapEditor
                      value={selectedSong.lyricsGap || ''}
                      onChange={(newVal) =>
                        handleSongChange(selectedSongIndex!, 'lyricsGap', newVal)
                      }
                    />
                  </div>
                )}

                {/* Timeline slider control */}
                <div className="border-t border-cyan-500/5 pt-4">
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

      {/* OVERLAY SEARCH MODAL */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-[#0b0e17] border border-cyan-500/20 max-w-2xl w-full h-[85vh] rounded-3xl p-6 shadow-2xl relative flex flex-col">
            
            {/* Modal Close */}
            <button
              onClick={() => {
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
                {SAMPLE_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleAddTrack(track)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-cyan-500/20 rounded-lg hover:border-cyan-400 active:scale-95 transition-all text-left truncate cursor-pointer select-none"
                  >
                    <img src={track.coverArtUrl} className="h-6 w-6 rounded border border-cyan-500/10 shrink-0" />
                    <div className="truncate text-[10px]">
                      <p className="font-bold text-foreground truncate max-w-[80px] leading-tight">{track.title}</p>
                      <p className="text-muted-foreground truncate max-w-[80px] leading-none">{track.artist}</p>
                    </div>
                  </button>
                ))}
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
                            className="h-10 w-10 rounded-lg border border-cyan-500/10 shrink-0"
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

                        <button
                          onClick={() => handleAddTrack(track)}
                          className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg active:scale-95 shrink-0 cursor-pointer transition-all"
                        >
                          + Add
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
