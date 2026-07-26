import { useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Slider } from '#/features/shared/components/ui/slider';

interface HostAudioControlsProps {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onRestartTimer: () => void;
  onForceReveal: () => void;
  onNextSong: () => void;
  onSeek?: (positionMs: number) => void;
  currentPositionMs?: number;
  durationMs?: number;
  revealed: boolean;
  isLastSong: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function HostAudioControls({
  isPlaying,
  onTogglePlayPause,
  onRestartTimer,
  onForceReveal,
  onNextSong,
  onSeek,
  currentPositionMs = 0,
  durationMs = 0,
  revealed,
  isLastSong,
}: HostAudioControlsProps) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const displayPosition = dragValue !== null ? dragValue : currentPositionMs;

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-cyan-500/10">
      {/* Full Song Scrubber Bar at Round End */}
      {revealed && durationMs > 0 && onSeek && (
        <div className="flex items-center gap-3 bg-black/40 border border-cyan-500/20 px-4 py-2 rounded-2xl">
          <span className="text-[10px] font-mono text-cyan-400 font-bold w-10 text-right">
            {formatTime(displayPosition)}
          </span>
          <Slider
            min={0}
            max={durationMs}
            value={[displayPosition]}
            onValueChange={(val) => {
              const num = Array.isArray(val) ? val[0] : Number(val);
              setDragValue(num);
            }}
            onValueCommitted={(val) => {
              const num = Array.isArray(val) ? val[0] : Number(val);
              onSeek(num);
              setDragValue(null);
            }}
            className="flex-1 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-muted-foreground font-bold w-10">
            {formatTime(durationMs)}
          </span>
        </div>
      )}

      {/* Main Playback & Round Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="cyan" size="sm" onClick={onTogglePlayPause}>
            {isPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
            {isPlaying ? (revealed ? 'Pause Song' : 'Pause Snippet') : (revealed ? 'Play Song' : 'Play Snippet')}
          </Button>

          {!revealed && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestartTimer}
              className="text-xs gap-1.5 border-cyan-500/30 text-cyan-400 hover:text-white cursor-pointer"
            >
              <RotateCcw size={12} /> Restart Timer & Song
            </Button>
          )}
        </div>

        <div>
          {!revealed ? (
            <Button variant="magenta" size="sm" onClick={onForceReveal}>
              Reveal Answer Now
            </Button>
          ) : (
            <Button variant="spotify" size="sm" onClick={onNextSong}>
              {isLastSong ? 'Finish Quiz' : 'Next Song →'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
