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

  const VolumeIcon =
    vol === AUDIO_CONFIG.MIN_VOLUME
      ? VolumeX
      : vol < AUDIO_CONFIG.DEFAULT_VOLUME
        ? Volume1
        : Volume2;

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
      data-expanded={isExpanded}
      className="fixed size-11 bottom-6 left-6 z-50 flex flex-col-reverse items-center gap-2.5 opacity-60 hover:opacity-100 bg-cyan-500/5 border border-cyan-500/20 backdrop-blur-xl rounded-full p-2 py-3 shadow-[0_0_15px_rgba(29,185,84,0.15)] shadow-cyan-500/10 transition-all duration-300 select-none overflow-hidden data-[expanded=true]:h-46"
    >
      <Button
        size="icon"
        onClick={handleMuteToggle}
        data-expanded={isExpanded}
        className="bg-transparent shadow-transparent text-cyan-500 size-6! transition-all duration-300"
      >
        <VolumeIcon size={18} />
      </Button>

      <Slider
        min={AUDIO_CONFIG.MIN_VOLUME}
        max={AUDIO_CONFIG.MAX_VOLUME}
        step={AUDIO_CONFIG.VOLUME_STEP}
        value={[vol]}
        onValueChange={(value) => setVol(Number(value))}
        orientation="vertical"
        data-expanded={isExpanded}
        className="h-28 data-[expanded=true]:opacity-100 data-[expanded=true]:pointer-events-auto opacity-0 pointer-events-none transition-all duration-300"
      />
    </div>
  );
}
