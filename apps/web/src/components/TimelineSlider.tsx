import { useRef, useEffect, useState } from 'react';

interface TimelineSliderProps {
  durationMs: number;
  startOffsetMs: number;
  endOffsetMs: number;
  onChange: (start: number, end: number) => void;
  currentPlaybackMs?: number | null;
}

export function TimelineSlider({
  durationMs,
  startOffsetMs,
  endOffsetMs,
  onChange,
  currentPlaybackMs = null,
}: TimelineSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<'start' | 'end' | 'range' | null>(null);
  const dragStartRef = useRef<{ startX: number; initialStart: number; initialEnd: number }>({
    startX: 0,
    initialStart: 0,
    initialEnd: 0,
  });

  const total = durationMs || 180000; // Fallback to 3 minutes

  const startPercent = (startOffsetMs / total) * 100;
  const endPercent = (endOffsetMs / total) * 100;
  const widthPercent = endPercent - startPercent;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMsFromX = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return Math.floor(pct * total);
  };

  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const currentMs = getMsFromX(e.clientX);
      const deltaX = e.clientX - dragStartRef.current.startX;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaMs = Math.floor((deltaX / rect.width) * total);

      if (activeDrag === 'start') {
        const nextStart = Math.max(0, Math.min(currentMs, endOffsetMs - 1000));
        onChange(nextStart, endOffsetMs);
      } else if (activeDrag === 'end') {
        const nextEnd = Math.max(startOffsetMs + 1000, Math.min(currentMs, total));
        onChange(startOffsetMs, nextEnd);
      } else if (activeDrag === 'range') {
        const rangeWidth = dragStartRef.current.initialEnd - dragStartRef.current.initialStart;
        let nextStart = dragStartRef.current.initialStart + deltaMs;
        let nextEnd = dragStartRef.current.initialEnd + deltaMs;

        if (nextStart < 0) {
          nextStart = 0;
          nextEnd = rangeWidth;
        } else if (nextEnd > total) {
          nextEnd = total;
          nextStart = total - rangeWidth;
        }

        onChange(nextStart, nextEnd);
      }
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, startOffsetMs, endOffsetMs, total, onChange]);

  const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'range') => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDrag(type);
    dragStartRef.current = {
      startX: e.clientX,
      initialStart: startOffsetMs,
      initialEnd: endOffsetMs,
    };
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (activeDrag) return;
    const clickedMs = getMsFromX(e.clientX);
    const rangeWidth = endOffsetMs - startOffsetMs;
    // Center the range around the clicked position
    let nextStart = clickedMs - Math.floor(rangeWidth / 2);
    let nextEnd = clickedMs + Math.ceil(rangeWidth / 2);

    if (nextStart < 0) {
      nextStart = 0;
      nextEnd = rangeWidth;
    } else if (nextEnd > total) {
      nextEnd = total;
      nextStart = total - rangeWidth;
    }

    onChange(nextStart, nextEnd);
  };

  // Percent position of active playback
  const playbackPercent = currentPlaybackMs !== null ? (currentPlaybackMs / total) * 100 : null;

  return (
    <div className="w-full space-y-2 select-none">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
        <span>Selected Range</span>
        <span className="text-lagoon">
          {formatTime(startOffsetMs)} - {formatTime(endOffsetMs)} ({Math.round((endOffsetMs - startOffsetMs) / 1000)}s)
        </span>
      </div>

      {/* Main Slider Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative w-full h-12 bg-foam/5 dark:bg-black/30 border border-line rounded-xl overflow-hidden cursor-pointer"
      >
        {/* Selected Highlight Range */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'range')}
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
          }}
          className="absolute top-0 bottom-0 bg-lagoon/20 hover:bg-lagoon/25 border-l-2 border-r-2 border-lagoon cursor-grab active:cursor-grabbing flex items-center justify-between transition-colors"
        >
          {/* Left Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'start')}
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-lagoon rounded-full cursor-col-resize shadow-md hover:scale-110 active:scale-95 transition-transform flex items-center justify-center border border-black/30"
          >
            <div className="w-0.5 h-3 bg-white/60 rounded-full" />
          </div>

          {/* Right Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'end')}
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-lagoon rounded-full cursor-col-resize shadow-md hover:scale-110 active:scale-95 transition-transform flex items-center justify-center border border-black/30"
          >
            <div className="w-0.5 h-3 bg-white/60 rounded-full" />
          </div>
        </div>

        {/* Playback Position Scrubber Line */}
        {playbackPercent !== null && playbackPercent >= 0 && playbackPercent <= 100 && (
          <div
            style={{ left: `${playbackPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-500 shadow-md pointer-events-none z-10"
          >
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-black/20" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0:00</span>
        <span>{formatTime(total)}</span>
      </div>
    </div>
  );
}
