import { useState, useEffect, useRef } from 'react';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';

export function useTimelineSlider(
  durationMs: number,
  startOffsetMs: number,
  endOffsetMs: number,
  currentPlaybackMs: number | null,
  onChange: (startOffsetMs: number, endOffsetMs: number) => void,
) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeDrag, setActiveDrag] = useState<'start' | 'end' | 'range' | null>(null);
  const wasDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; initialStart: number; initialEnd: number }>({
    startX: 0,
    initialStart: 0,
    initialEnd: 0,
  });

  const total = durationMs || GAME_CONFIG.FALLBACK_SONG_DURATION_MS;

  const [localStart, setLocalStart] = useState(startOffsetMs);
  const [localEnd, setLocalEnd] = useState(endOffsetMs);

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
      wasDraggingRef.current = true;

      const currentMs = getMsFromX(e.clientX);
      const deltaX = e.clientX - dragStartRef.current.startX;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaMs = Math.floor((deltaX / rect.width) * total);
      const minPlayWindowMs = GAME_CONFIG.MIN_SNIPPET_WINDOW_MS;

      if (activeDrag === 'start') {
        const nextStart = Math.max(0, Math.min(currentMs, localEnd - minPlayWindowMs));
        setLocalStart(nextStart);
        onChange(nextStart, localEnd);
      } else if (activeDrag === 'end') {
        const nextEnd = Math.max(localStart + minPlayWindowMs, Math.min(currentMs, total));
        setLocalEnd(nextEnd);
        onChange(localStart, nextEnd);
      } else {
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

  const playbackPercent = currentPlaybackMs !== null ? (currentPlaybackMs / total) * 100 : null;

  return {
    trackRef,
    localStart,
    localEnd,
    total,
    startPercent,
    endPercent,
    widthPercent,
    formatTime,
    handleMouseDown,
    handleTrackClick,
    playbackPercent,
  };
}
