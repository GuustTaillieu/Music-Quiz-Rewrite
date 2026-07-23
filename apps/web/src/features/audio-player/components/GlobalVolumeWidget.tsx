import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useGlobalVolume } from '../hooks/useGlobalVolume';
import { Slider } from '#/features/shared/components/ui/slider';
import { AUDIO_CONFIG } from '#/features/shared/constants/gameConfig';
import { Button } from '#/features/shared/components/ui/button';

export function GlobalVolumeWidget() {
  const [vol, setVol] = useGlobalVolume();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleOutsideClick = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!mounted) return null;

  const VolumeIcon = vol === AUDIO_CONFIG.MIN_VOLUME ? VolumeX : vol < AUDIO_CONFIG.DEFAULT_VOLUME ? Volume1 : Volume2;

  const handleMuteToggle = () => {
    if (vol > AUDIO_CONFIG.MIN_VOLUME) {
      setVol(AUDIO_CONFIG.MIN_VOLUME);
    } else {
      setVol(AUDIO_CONFIG.DEFAULT_VOLUME);
    }
  };

  return (
    <div
      ref={widgetRef}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 bg-black/75 border border-spotify/20 backdrop-blur-xl rounded-full p-2 px-3 shadow-[0_0_15px_rgba(29,185,84,0.15)] shadow-spotify/10 transition-all duration-300 select-none group"
      style={{
        width: isExpanded ? '180px' : '44px',
        overflow: 'hidden',
        height: '44px',
      }}
    >
      <Button
        size='icon'
        onClick={handleMuteToggle}
        className='bg-transparent text-spotify hover:bg-transparent hover:shadow-transparent'
      >
        <VolumeIcon size={18} />
      </Button>

      <div
        className="flex items-center gap-2 w-full transition-opacity duration-300"
        style={{
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
        }}
      >
        <Slider
          min={AUDIO_CONFIG.MIN_VOLUME}
          max={AUDIO_CONFIG.MAX_VOLUME}
          step={AUDIO_CONFIG.VOLUME_STEP}
          value={vol}
          onValueChange={(value) => setVol(Number(value))}
          orientation='horizontal'
        />
        <span className="text-[9px] font-mono text-muted-foreground w-6 text-right shrink-0">
          {Math.round(vol * 100)}%
        </span>
      </div>
    </div>
  );
}
