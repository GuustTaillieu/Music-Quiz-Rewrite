import { useRef, useEffect, useState } from 'react';

interface TimelineSliderProps {
  durationMs: number;
  startOffsetMs: number;
  endOffsetMs: number;
  onChange: (start: number, end: number) => void;
  currentPlaybackMs?: number | null;
}

// Deterministic mock visualizer generator to give each song a unique visual fingerprint
const generateBars = (songId: string, count = 50) => {
  const bars: number[] = [];
  let hash = 0;
  const idStr = songId || 'default-song';
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  for (let i = 0; i < count; i++) {
    const pseudoRand = Math.abs(Math.sin(hash + i) * 100);
    // Height percentage bounds between 15% and 85%
    const height = Math.max(15, Math.min(85, Math.floor(pseudoRand)));
    bars.push(height);
  }
  return bars;
};

export function TimelineSlider({
  durationMs,
  startOffsetMs,
  endOffsetMs,
  onChange,
  currentPlaybackMs = null,
}: TimelineSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<'start' | 'end' | 'range' | null>(null);
  const wasDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; initialStart: number; initialEnd: number }>({
    startX: 0,
    initialStart: 0,
    initialEnd: 0,
  });

  const total = durationMs || 180000; // Fallback to 3 minutes

  // Local state to keep dragging extremely smooth (avoiding React render cycle lags)
  const [localStart, setLocalStart] = useState(startOffsetMs);
  const [localEnd, setLocalEnd] = useState(endOffsetMs);

  // Sync props to local state strictly when NOT dragging
  useEffect(() => {
    if (!activeDrag) {
      setLocalStart(startOffsetMs);
      setLocalEnd(endOffsetMs);
    }
  }, [startOffsetMs, endOffsetMs, activeDrag]);

  const startPercent = (localStart / total) * 100;
  const endPercent = (localEnd / total) * 100;
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
      wasDraggingRef.current = true; // Mark dragging has occurred to prevent clicks on mouseup
      
      const currentMs = getMsFromX(e.clientX);
      const deltaX = e.clientX - dragStartRef.current.startX;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaMs = Math.floor((deltaX / rect.width) * total);

      // Enforce 5s minimum playing window
      const minPlayWindowMs = 5000;

      if (activeDrag === 'start') {
        const nextStart = Math.max(0, Math.min(currentMs, localEnd - minPlayWindowMs));
        setLocalStart(nextStart);
        onChange(nextStart, localEnd);
      } else if (activeDrag === 'end') {
        const nextEnd = Math.max(localStart + minPlayWindowMs, Math.min(currentMs, total));
        setLocalEnd(nextEnd);
        onChange(localStart, nextEnd);
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

        setLocalStart(nextStart);
        setLocalEnd(nextEnd);
        onChange(nextStart, nextEnd);
      }
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
      // Swallows track-click for a brief layout cycle
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 80);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, localStart, localEnd, total, onChange]);

  const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'range') => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDrag(type);
    wasDraggingRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      initialStart: localStart,
      initialEnd: localEnd,
    };
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (activeDrag || wasDraggingRef.current) return;
    const clickedMs = getMsFromX(e.clientX);
    const rangeWidth = localEnd - localStart;
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

    setLocalStart(nextStart);
    setLocalEnd(nextEnd);
    onChange(nextStart, nextEnd);
  };

  // Percent position of active playback
  const playbackPercent = currentPlaybackMs !== null ? (currentPlaybackMs / total) * 100 : null;

  // Generate vertical bars deterministically
  const waveformBars = generateBars(total.toString(), 60);

  return (
    <div className="w-full space-y-2 select-none">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
        <span>Timeline Snippet Crop (5s min)</span>
        <span className="text-[#00f0ff] font-black glow-text-cyan">
          {formatTime(localStart)} - {formatTime(localEnd)} ({Math.round((localEnd - localStart) / 1000)}s)
        </span>
      </div>

      {/* Main Slider Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative w-full h-14 bg-black/50 border border-cyan-500/20 rounded-xl overflow-hidden cursor-pointer flex items-center"
      >
        {/* Waveform visualizer backdrop */}
        <div className="absolute inset-0 flex items-center justify-between px-3 gap-[2px] opacity-40 pointer-events-none">
          {waveformBars.map((height, idx) => {
            const barPct = (idx / waveformBars.length) * 100;
            const isInside = barPct >= startPercent && barPct <= endPercent;
            return (
              <div
                key={idx}
                style={{ height: `${height}%` }}
                className={`w-[4px] rounded-full transition-all duration-300 ${
                  isInside
                    ? 'bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.5)]'
                    : 'bg-cyan-950/30 border border-cyan-500/5'
                }`}
              />
            );
          })}
        </div>

        {/* Selected Highlight Range */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'range')}
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
          }}
          className="absolute top-0 bottom-0 bg-cyan-500/10 hover:bg-cyan-500/15 border-l border-r border-[#00f0ff] cursor-grab active:cursor-grabbing flex items-center justify-between transition-colors shadow-[0_0_15px_rgba(0,240,255,0.15)]"
        >
          {/* Left Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'start')}
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-9 bg-[#00f0ff] rounded-full cursor-col-resize shadow-[0_0_10px_rgba(0,240,255,0.6)] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center border border-black/40"
          >
            <div className="w-0.5 h-3 bg-black/60 rounded-full" />
          </div>

          {/* Right Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'end')}
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-9 bg-[#00f0ff] rounded-full cursor-col-resize shadow-[0_0_10px_rgba(0,240,255,0.6)] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center border border-black/40"
          >
            <div className="w-0.5 h-3 bg-black/60 rounded-full" />
          </div>
        </div>

        {/* Playback Position Scrubber Line */}
        {playbackPercent !== null && playbackPercent >= 0 && playbackPercent <= 100 && (
          <div
            style={{ left: `${playbackPercent}%` }}
            className="absolute top-0 bottom-0 w-[2px] bg-[#ff007f] shadow-[0_0_8px_rgba(255,0,127,0.7)] pointer-events-none z-10 transition-all duration-75"
          >
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#ff007f] rounded-full border border-black/20" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
        <span>0:00</span>
        <span>{formatTime(total)}</span>
      </div>
    </div>
  );
}
