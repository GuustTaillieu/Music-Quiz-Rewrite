import { Play, Pause } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';

interface HostAudioControlsProps {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onForceReveal: () => void;
  onNextSong: () => void;
  revealed: boolean;
  isLastSong: boolean;
}

export function HostAudioControls({
  isPlaying,
  onTogglePlayPause,
  onForceReveal,
  onNextSong,
  revealed,
  isLastSong,
}: HostAudioControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 pt-4 border-t border-cyan-500/10">
      <Button variant="cyan" size="sm" onClick={onTogglePlayPause}>
        {isPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
        {isPlaying ? 'Pause Snippet' : 'Play Snippet'}
      </Button>

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
  );
}
