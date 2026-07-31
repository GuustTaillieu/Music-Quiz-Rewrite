import { Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Timeline, useSpotifyPlayer } from '#/features/audio-player';

interface HostAudioControlsProps {
  onForceReveal: () => void;
  onNextSong: () => void;
  revealed: boolean;
  isLastSong: boolean;
  onRestartSong: () => void;
}

export function HostAudioControls({
  onForceReveal,
  onNextSong,
  revealed,
  isLastSong,
  onRestartSong,
}: HostAudioControlsProps) {
  const { isPlaying, togglePlayPause, durationMs } = useSpotifyPlayer();

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-cyan-500/10">
      {/* Full Song Scrubber Bar at Round End */}
      {revealed && durationMs > 0 && (
        <div className="flex items-center gap-3 bg-black/40 border border-cyan-500/20 px-4 py-2 rounded-2xl">
          <Timeline />
        </div>
      )}

      {/* Main Playback & Round Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {revealed && (
            <Button
              onClick={togglePlayPause}
              variant="default"
              size="sm"
              className='gap-2'
            >

              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          )}

          {!revealed && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestartSong}
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
