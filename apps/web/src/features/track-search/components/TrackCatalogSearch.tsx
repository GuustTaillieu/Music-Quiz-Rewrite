import { useRef } from 'react';
import { Search, Disc, X, Check, Plus } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '#/features/shared/components/ui/input';
import { Button } from '#/features/shared/components/ui/button';
import type { SpotifyTrack, QuizSong } from '@spotify-music-quiz/shared/schema/game';
import { useTrackSearch } from '../hooks/useTrackSearch';

interface TrackCatalogSearchProps {
  isOpen: boolean;
  onClose: () => void;
  songs: QuizSong[];
  handleAddTrack: (track: SpotifyTrack) => void;
  handleRemoveTrackById: (id: string) => void;
}

export function TrackCatalogSearch({
  isOpen,
  onClose,
  songs,
  handleAddTrack,
  handleRemoveTrackById,
}: TrackCatalogSearchProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    startTransition,
    searchResults,
    isSearching,
  } = useTrackSearch();

  const rowVirtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-[#0b0e17] border border-cyan-500/20 max-w-2xl w-full h-[80vh] rounded-3xl p-6 shadow-2xl relative flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-white cursor-pointer"
        >
          <X size={18} />
        </Button>

        <h3 className="text-lg font-black text-white mb-1 text-left">Search Spotify Catalog</h3>
        <p className="text-xs text-muted-foreground mb-4 text-left">
          Query track titles or artists from Spotify.
        </p>

        <div className="relative mb-4 shrink-0">
          <Input
            type="text"
            placeholder="Search tracks or artists..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              startTransition(() => {});
            }}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 text-[#00f0ff]" size={16} />
        </div>

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
                      <Button
                        variant="cyan"
                        size="icon"
                        onClick={() => handleRemoveTrackById(track.id)}
                        className="h-8 w-8 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.4)] cursor-pointer"
                        title="Remove Song"
                      >
                        <Check size={14} strokeWidth={3} />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleAddTrack(track)}
                        className="h-8 w-8 rounded-full border-cyan-500/35 text-cyan-400 hover:bg-cyan-500 hover:text-black cursor-pointer"
                        title="Add Song"
                      >
                        <Plus size={14} />
                      </Button>
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
