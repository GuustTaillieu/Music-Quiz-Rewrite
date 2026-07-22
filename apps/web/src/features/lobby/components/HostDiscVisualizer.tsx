import { Disc } from 'lucide-react';
import { CavaVisualizer } from './CavaVisualizer';

interface HostDiscVisualizerProps {
  coverArtUrl?: string | null;
  songTitle?: string | null;
  artistName?: string | null;
  albumName?: string | null;
  isPlaying: boolean;
  revealed: boolean;
}

export function HostDiscVisualizer({
  coverArtUrl,
  songTitle,
  artistName,
  albumName,
  isPlaying,
  revealed,
}: HostDiscVisualizerProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-4">
        {/* Disc Wrapper */}
        <div
          className={`h-40 w-40 rounded-full border-4 border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-transform duration-700 ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
        >
          {coverArtUrl ? (
            <img
              src={coverArtUrl}
              alt="Track Cover"
              className={`h-full w-full object-cover transition-all duration-500 ${
                revealed ? 'blur-0 opacity-100' : 'blur-xl opacity-60 scale-125'
              }`}
            />
          ) : (
            <div className="h-full w-full bg-black/60 flex items-center justify-center text-cyan-400">
              <Disc size={48} />
            </div>
          )}
        </div>

        {/* Center spindle hole */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#05070f] border-2 border-cyan-400/50 shadow-inner" />
      </div>

      <CavaVisualizer isPlaying={isPlaying} />

      {/* Revealed Track Title */}
      {revealed ? (
        <div className="mt-3 animate-fade-in">
          <h3 className="font-black text-xl text-white tracking-tight leading-snug">
            {songTitle || 'Unknown Track'}
          </h3>
          <p className="text-sm font-bold text-[#00f0ff]">{artistName || 'Unknown Artist'}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            {albumName || 'Unknown Album'}
          </p>
        </div>
      ) : (
        <div className="mt-3 text-cyan-400 font-black text-sm uppercase tracking-widest animate-pulse">
          &bull; &bull; &bull; &bull; &bull; &bull; &bull;
        </div>
      )}
    </div>
  );
}
