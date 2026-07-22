import { Clock } from 'lucide-react';
import { Progress } from '#/features/shared/components/ui/progress';

interface HostTimerProgressBarProps {
  localTimeLeft: number | null;
  maxTimeLimit: number;
}

export function HostTimerProgressBar({ localTimeLeft, maxTimeLimit }: HostTimerProgressBarProps) {
  const timeLeft = localTimeLeft ?? maxTimeLimit;
  const isWarning = timeLeft <= 10;

  return (
    <div className="w-full max-w-md mx-auto my-4 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-mono font-bold">
        <span className="flex items-center gap-1.5 text-cyan-400 uppercase tracking-wider">
          <Clock size={12} /> Time Remaining
        </span>
        <span className={isWarning ? 'text-rose-500 font-black animate-ping' : 'text-[#00f0ff]'}>
          {timeLeft}s
        </span>
      </div>

      <Progress
        value={timeLeft}
        max={maxTimeLimit}
        indicatorClassName={isWarning ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-[#00f0ff]'}
      />
    </div>
  );
}
