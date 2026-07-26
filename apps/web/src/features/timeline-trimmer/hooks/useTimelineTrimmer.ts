import { useState, useEffect, useRef } from 'react';

export function useTimelineTrimmer(
  durationMs: number,
  startOffsetMs: number,
  endOffsetMs: number,
  currentPlaybackMs: number | null,
  onChange: (start: number, end: number) => void
) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [localStart, setLocalStart] = useState(startOffsetMs);
  const [localEnd, setLocalEnd] = useState(endOffsetMs);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; initialStart: number; initialEnd: number }>({
    startX: 0,
    initialStart: 0,
    initialEnd: 0,
  });

  const total = Math.max(1000, durationMs);
  const MIN_WINDOW_MS = 5000;

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalStart(startOffsetMs);
      setLocalEnd(endOffsetMs);
    }
  }, [startOffsetMs, endOffsetMs]);

  const getMsFromX = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return Math.floor(pct * total);
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'range') => {
    e.preventDefault();
    e.stopPropagation();

    if (!trackRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;

    dragStartRef.current = {
      startX: e.clientX,
      initialStart: localStart,
      initialEnd: localEnd,
    };

    const initialStart = localStart;
    const initialEnd = localEnd;
    const rangeWidth = initialEnd - initialStart;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!trackRef.current) return;
      hasDraggedRef.current = true;

      const rect = trackRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaMs = Math.round((deltaX / rect.width) * total);

      let nextStart = initialStart;
      let nextEnd = initialEnd;

      if (type === 'start') {
        nextStart = initialStart + deltaMs;
        nextStart = Math.max(0, Math.min(nextStart, initialEnd - MIN_WINDOW_MS));
      } else if (type === 'end') {
        nextEnd = initialEnd + deltaMs;
        nextEnd = Math.min(total, Math.max(nextEnd, initialStart + MIN_WINDOW_MS));
      } else if (type === 'range') {
        nextStart = initialStart + deltaMs;
        nextEnd = initialEnd + deltaMs;

        if (nextStart < 0) {
          nextStart = 0;
          nextEnd = rangeWidth;
        } else if (nextEnd > total) {
          nextEnd = total;
          nextStart = total - rangeWidth;
        }
      }

      setLocalStart(nextStart);
      setLocalEnd(nextEnd);
      onChange(nextStart, nextEnd);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // Keep hasDraggedRef true briefly to swallow the synthetic click event on trackRef
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current || hasDraggedRef.current || !trackRef.current) return;
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

  const startPercent = (localStart / total) * 100;
  const endPercent = (localEnd / total) * 100;
  const widthPercent = Math.max(0, endPercent - startPercent);

  const playbackPercent =
    currentPlaybackMs !== null ? (currentPlaybackMs / total) * 100 : null;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
