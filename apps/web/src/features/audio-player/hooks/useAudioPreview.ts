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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    spotifyPlayer.setVolume(globalVolume);
    if (audioRef.current) {
      audioRef.current.volume = globalVolume;
    }
  }, [globalVolume, spotifyPlayer.deviceId]);

  useEffect(() => {
    stopAudioPreview();
  }, [selectedSong?.spotifyTrackId]);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopAudioPreview = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    spotifyPlayer.pauseTrack();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingPreview(false);
    setCurrentPlaybackMs(null);
  };

  const playAudioPreview = async () => {
    if (!selectedSong) return;
    stopAudioPreview();

    const startOffset = selectedSong.start_offset_ms || EDITOR_CONSTANTS.DEFAULT_START_OFFSET_MS;
    const endOffset = selectedSong.end_offset_ms || EDITOR_CONSTANTS.DEFAULT_END_OFFSET_MS;

    // Check if deviceId is ready or wait briefly (up to 1.5s)
    let activeDeviceId = spotifyPlayer.deviceId;
    if (!activeDeviceId) {
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 100));
        if (spotifyPlayer.deviceId) {
          activeDeviceId = spotifyPlayer.deviceId;
          break;
        }
      }
    }

    if (activeDeviceId) {
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
    } else if (selectedSong.track.previewUrl) {
      // Fallback to previewUrl HTML5 audio if Web Playback SDK is not ready yet
      audioRef.current = new Audio(selectedSong.track.previewUrl);
      audioRef.current.volume = globalVolume;
      audioRef.current.currentTime = startOffset / 1000;
      audioRef.current.play().catch(console.error);

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
    } else {
      alert(EDITOR_CONSTANTS.ERRORS.SPOTIFY_SDK_NOT_READY);
    }
  };

  return {
    spotifyPlayer,
    currentPlaybackMs,
    isPlayingPreview,
    playAudioPreview,
    stopAudioPreview,
  };
}
