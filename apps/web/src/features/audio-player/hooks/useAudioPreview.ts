import { useState, useEffect, useRef } from 'react';
import { useSpotifyPlayer } from './useSpotifyPlayer';
import { useGlobalVolume } from './useGlobalVolume';
import { EDITOR_CONSTANTS } from '#/features/quiz-editor/constants/editorConstants';
import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';

export function useAudioPreview(selectedSong: QuizSong | null) {
  const spotifyPlayer = useSpotifyPlayer(true);
  const [globalVolume] = useGlobalVolume();
  const [currentPlaybackMs, setCurrentPlaybackMs] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    spotifyPlayer.setVolume(globalVolume);
  }, [globalVolume, spotifyPlayer.deviceId]);

  useEffect(() => {
    stopAudioPreview();
  }, [selectedSong?.spotifyTrackId]);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  const stopAudioPreview = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    spotifyPlayer.pauseTrack();
    setIsPlayingPreview(false);
    setCurrentPlaybackMs(null);
  };

  const playAudioPreview = () => {
    if (!selectedSong) return;
    if (!spotifyPlayer.deviceId) {
      alert(EDITOR_CONSTANTS.ERRORS.SPOTIFY_SDK_NOT_READY);
      return;
    }

    stopAudioPreview();

    const startOffset = selectedSong.start_offset_ms || EDITOR_CONSTANTS.DEFAULT_START_OFFSET_MS;
    const endOffset = selectedSong.end_offset_ms || EDITOR_CONSTANTS.DEFAULT_END_OFFSET_MS;

    spotifyPlayer.playTrack(selectedSong.spotifyTrackId, startOffset);
    setIsPlayingPreview(true);
    setCurrentPlaybackMs(startOffset);

    const checkInterval = EDITOR_CONSTANTS.PREVIEW_CHECK_INTERVAL_MS;
    let elapsed = 0;
    playbackTimerRef.current = setInterval(() => {
      elapsed += checkInterval;
      const currentMs = startOffset + elapsed;
      setCurrentPlaybackMs(currentMs);

      if (currentMs >= endOffset) {
        stopAudioPreview();
      }
    }, checkInterval);
  };

  return {
    spotifyPlayer,
    currentPlaybackMs,
    isPlayingPreview,
    playAudioPreview,
    stopAudioPreview,
  };
}
