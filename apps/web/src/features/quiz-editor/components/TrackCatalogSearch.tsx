import { Search, Music, Disc, X, Check, Plus } from 'lucide-react';
import type { SpotifyTrack, QuizSong } from '@spotify-music-quiz/shared/schema/game';

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

interface TrackCatalogSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  startTransition: (cb: () => void) => void;
  songs: QuizSong[];
  handleAddTrack: (track: SpotifyTrack) => void;
  handleRemoveTrackById: (id: string) => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
  isSearching: boolean;
  searchResults?: SpotifyTrack[];
  rowVirtualizer: any;
}

export function TrackCatalogSearch({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  startTransition,
  songs,
  handleAddTrack,
  handleRemoveTrackById,
  parentRef,
  isSearching,
  searchResults,
  rowVirtualizer,
}: TrackCatalogSearchProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-[#0b0e17] border border-cyan-500/20 max-w-2xl w-full h-[85vh] rounded-3xl p-6 shadow-2xl relative flex flex-col">
        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-black text-white mb-1 text-left">Search Spotify Music</h3>
        <p className="text-xs text-muted-foreground mb-4 text-left">
          Query track titles or artists to include them in this quiz. Added songs will populate in the editor list.
        </p>

        {/* Search input */}
        <div className="relative mb-4 shrink-0">
          <input
            type="text"
            placeholder="Search tracks or artists..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              startTransition(() => {});
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
              {rowVirtualizer.getVirtualItems().map((virtualRow: any) => {
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
  );
}
