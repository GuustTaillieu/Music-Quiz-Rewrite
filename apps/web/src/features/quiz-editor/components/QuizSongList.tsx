import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { useDraggableList } from '#/features/shared/hooks/useDraggableList';
import { Button } from '#/features/shared/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/features/shared/components/ui/tooltip';
import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';

interface QuizSongListProps {
  songs: QuizSong[];
  selectedSongIndex: number | null;
  setSelectedSongIndex: (index: number) => void;
  onOpenSearch: () => void;
  onRemoveTrack: (index: number) => void;
  onReorderSongs: (startIndex: number, endIndex: number) => void;
}

export function QuizSongList({
  songs,
  selectedSongIndex,
  setSelectedSongIndex,
  onOpenSearch,
  onRemoveTrack,
  onReorderSongs,
}: QuizSongListProps) {
  const { draggedIndex, getDragProps } = useDraggableList(onReorderSongs);

  return (
    <TooltipProvider>
      <div className="lg:col-span-1 island-shell p-6 rounded-2xl flex flex-col h-[calc(100vh-170px)] min-h-0 bg-black/60 border border-cyan-500/10 glow-border-cyan backdrop-blur-xl">
        <div className="flex items-center justify-between shrink-0 mb-4 pb-2 border-b border-cyan-500/5">
          <h3 className="font-black text-pink-400 text-xs uppercase tracking-wider">
            Quiz Tracks ({songs.length})
          </h3>

          <Button variant="cyan" size="sm" onClick={onOpenSearch}>
            <Plus size={12} /> Add Tracks
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 select-none">
          {songs.map((song, index) => {
            const dragProps = getDragProps(index);

            return (
              <div
                key={index}
                onClick={() => setSelectedSongIndex(index)}
                {...dragProps}
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
                    className="h-8 w-8 rounded-lg border border-cyan-500/10 shrink-0 object-cover"
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(index);
                      }}
                      variant='destructive_ghost'
                      size='icon'
                    >
                      <Trash2 size={13} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove Track</TooltipContent>
                </Tooltip>
              </div>
            );
          })}

          {songs.length === 0 && (
            <div className="text-center py-16 text-xs text-muted-foreground">
              No songs added. Click <strong>Add Tracks</strong> above to search and populate your music quiz catalog.
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
