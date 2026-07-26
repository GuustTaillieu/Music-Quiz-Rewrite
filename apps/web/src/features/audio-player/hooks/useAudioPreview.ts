import { useState, useEffect, useRef } from 'react';
import { useSpotifyPlayer } from './useSpotifyPlayer';
import { useGlobalVolume } from './useGlobalVolume';
import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';

const DEFAULT_START_OFFSET_MS = 0;
const DEFAULT_END_OFFSET_MS = 30000;
const PREVIEW_CHECK_INTERVAL_MS = 100;

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

  const playAudioPreview = async () => {
    if (!selectedSong) return;
    stopAudioPreview();

    const startOffset = selectedSong.start_offset_ms || DEFAULT_START_OFFSET_MS;
    const endOffset = selectedSong.end_offset_ms || DEFAULT_END_OFFSET_MS;

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

      let elapsed = 0;
      playbackTimerRef.current = setInterval(() => {
        elapsed += PREVIEW_CHECK_INTERVAL_MS;
        const currentMs = startOffset + elapsed;
        setCurrentPlaybackMs(currentMs);

        if (currentMs >= endOffset) {
          stopAudioPreview();
        }
      }, PREVIEW_CHECK_INTERVAL_MS);
    } else {
      alert('Spotify Player is initializing... Please try again in a moment.');
    }
  };

  return {
    currentPlaybackMs,
    isPlayingPreview,
    playAudioPreview,
    stopAudioPreview,
  };
}
