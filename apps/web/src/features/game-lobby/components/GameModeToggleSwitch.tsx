import { useState, useLayoutEffect, useRef } from 'react';
import { Zap, Users } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { cn } from '#/features/shared/lib/utils';

interface GameModeToggleSwitchProps {
  selectedMode: 'SPEED_MODE' | 'TURN_BASED';
  onSelectMode: (mode: 'SPEED_MODE' | 'TURN_BASED') => void;
  className?: string;
}

export function GameModeToggleSwitch({
  selectedMode,
  onSelectMode,
  className = '',
}: GameModeToggleSwitchProps) {
  const turnBasedRef = useRef<HTMLButtonElement>(null);
  const speedBasedRef = useRef<HTMLButtonElement>(null);
  const isTurnBased = selectedMode === 'TURN_BASED';

  const [pillStyle, setPillStyle] = useState<{ width: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const updatePillPosition = () => {
      const activeEl = isTurnBased ? turnBasedRef.current : speedBasedRef.current;
      if (activeEl) {
        setPillStyle({
          width: activeEl.offsetWidth,
          left: activeEl.offsetLeft,
        });
      }
    };

    updatePillPosition();

    window.addEventListener('resize', updatePillPosition);
    return () => window.removeEventListener('resize', updatePillPosition);
  }, [isTurnBased]);

  return (
    <div className={`relative flex items-center bg-black/60 border border-cyan-500/20 rounded-full p-1 shadow-inner backdrop-blur-md select-none ${className}`}>
      <div
        className={`absolute top-0 h-[calc(100%-8px)] my-1 transition-all duration-300 rounded-full ${
          isTurnBased
            ? 'bg-cyan-500/10 border border-cyan-500/30'
            : 'bg-pink-500/10 border border-pink-500/30'
        }`}
        style={{
          width: pillStyle?.width ?? (isTurnBased ? turnBasedRef.current?.offsetWidth : speedBasedRef.current?.offsetWidth),
          left: pillStyle?.left ?? (isTurnBased ? turnBasedRef.current?.offsetLeft : speedBasedRef.current?.offsetLeft),
          opacity: pillStyle ? 1 : 0,
        }}
      />

      <Button
        ref={turnBasedRef}
        type="button"
        variant="ghost"
        onClick={() => onSelectMode('TURN_BASED')}
        className={cn(
          'relative z-10 flex-1 rounded-full text-xs font-black transition-colors cursor-pointer gap-2 py-2',
          isTurnBased ? 'text-cyan-400 hover:text-cyan-400 font-extrabold' : 'text-muted-foreground hover:text-white'
        )}
      >
        <Users size={14} className={isTurnBased ? 'text-cyan-400' : 'text-muted-foreground'} />
        <span>Turn-Based</span>
      </Button>

      <Button
        ref={speedBasedRef}
        type="button"
        variant="ghost"
        onClick={() => onSelectMode('SPEED_MODE')}
        className={cn(
          'relative z-10 flex-1 rounded-full text-xs font-black transition-colors cursor-pointer gap-2 py-2',
          !isTurnBased ? 'text-pink-400 hover:text-pink-400 font-extrabold' : 'text-muted-foreground hover:text-white'
        )}
      >
        <Zap size={14} className={!isTurnBased ? 'text-pink-400' : 'text-muted-foreground'} />
        <span>Speed Mode (All Guess)</span>
      </Button>
    </div>
  );
}
