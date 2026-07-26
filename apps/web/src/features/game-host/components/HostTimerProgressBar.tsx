interface HostTimerProgressBarProps {
  localTimeLeft: number | null;
  maxTimeLimit: number;
}

export function HostTimerProgressBar({ localTimeLeft, maxTimeLimit }: HostTimerProgressBarProps) {
  if (localTimeLeft === null) return null;

  const secondsLeft = Math.max(0, localTimeLeft);
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / maxTimeLimit) * 100));
  const isCritical = secondsLeft <= 5 && secondsLeft > 0;

  return (
    <div className="w-full my-4 space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono font-bold">
        <span className={isCritical ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}>
          {secondsLeft === 0 ? "TIME'S UP!" : 'ROUND COUNTDOWN'}
        </span>
        <span className={isCritical ? 'text-rose-400 font-extrabold' : 'text-[#00f0ff]'}>
          {secondsLeft}s
        </span>
      </div>

      <div className="h-2 w-full bg-cyan-950/40 rounded-full overflow-hidden border border-cyan-500/20">
        <div
          className={`h-full transition-all duration-300 ${
            secondsLeft === 0
              ? 'bg-rose-600'
              : isCritical
              ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]'
              : 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
