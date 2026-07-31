import { useState, useEffect, useRef } from 'react';
import { useSpotifyPlayer } from './useSpotifyPlayer';
import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';

const DEFAULT_START_OFFSET_MS = 0;
const DEFAULT_END_OFFSET_MS = 30000;
const PREVIEW_CHECK_INTERVAL_MS = 100;

export function useAudioPreview(selectedSong: QuizSong | null) {
  const spotifyPlayer = useSpotifyPlayer();
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState<number | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    stopAudioPreview();
  }, [selectedSong?.spotifyTrackId]);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  const stopAudioPreview = () => {
    if (!spotifyPlayer.isReady) return;
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    spotifyPlayer.pauseTrack();
    setCurrentPlaybackMs(null);
  };

  const playAudioPreview = async () => {
    if (!spotifyPlayer.isReady || !selectedSong) return;
    stopAudioPreview();

    const startOffset = selectedSong.start_offset_ms || DEFAULT_START_OFFSET_MS;
    const endOffset = selectedSong.end_offset_ms || DEFAULT_END_OFFSET_MS;

    spotifyPlayer.playTrack(selectedSong.spotifyTrackId, startOffset);
    setCurrentPlaybackMs(startOffset);

    let elapsed = 0;
    playbackTimerRef.current = setInterval(() => {
      elapsed += PREVIEW_CHECK_INTERVAL_MS;
      const currentMs = startOffset + elapsed;
      setCurrentPlaybackMs(currentMs);

      if (currentMs >= endOffset) {
        stopAudioPreview();
      }
    }, PREVIEW_CHECK_INTERVAL_MS);
  };

  return {
    currentPlaybackMs,
    isPlayingPreview: spotifyPlayer.isPlaying,
    playAudioPreview,
    stopAudioPreview,
  };
}
