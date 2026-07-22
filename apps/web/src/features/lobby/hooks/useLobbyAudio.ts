import { useState, useEffect, useRef } from 'react';
import { useSpotifyPlayer } from '#/features/audio-player/hooks/useSpotifyPlayer';
import { useGlobalVolume } from '#/features/audio-player/hooks/useGlobalVolume';
import { LOBBY_CONSTANTS } from '../constants/lobbyConstants';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import type { GameSessionState } from '@spotify-music-quiz/shared/schema/game';

export function useLobbyAudio(gameState: GameSessionState | null, isHost: boolean) {
  const spotifyPlayer = useSpotifyPlayer(isHost);
  const [globalVolume] = useGlobalVolume();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMs, setPlaybackMs] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSongIndexRef = useRef<number | null>(null);

  useEffect(() => {
    spotifyPlayer.setVolume(globalVolume);
    if (audioRef.current) {
      audioRef.current.volume = globalVolume;
    }
  }, [globalVolume, spotifyPlayer.deviceId]);

  const activeSong = gameState?.activeSong;
  const songIndex = gameState?.currentSongIndex ?? null;
  const isPlayingPhase = gameState?.phase === 'SPEED_ROUND' || gameState?.phase === 'TURN_BASED';

  useEffect(() => {
    if (!isHost || !gameState || !isPlayingPhase || songIndex === null || !activeSong) {
      if (isHost && isPlaying) {
        spotifyPlayer.pauseTrack();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    const isNewSong = prevSongIndexRef.current !== songIndex;
    prevSongIndexRef.current = songIndex;

    if (isNewSong) {
      const startOffset = activeSong.start_offset_ms || 0;
      const endOffset = activeSong.end_offset_ms || GAME_CONFIG.DEFAULT_SNIPPET_WINDOW_MS;
      const durationMs = Math.max(GAME_CONFIG.MIN_SNIPPET_WINDOW_MS, endOffset - startOffset);

      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

      if (spotifyPlayer.deviceId) {
        spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
        setIsPlaying(true);
        setPlaybackMs(startOffset);

        setTimeout(() => {
          if (!spotifyPlayer.isPlaying) {
            spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
          }
        }, LOBBY_CONSTANTS.RETRY_PLAYBACK_DELAY_MS);
      } else if (activeSong.previewUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = activeSong.previewUrl;
        audioRef.current.volume = globalVolume;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }

      stopTimeoutRef.current = setTimeout(() => {
        spotifyPlayer.pauseTrack();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      }, durationMs);
    }
  }, [isHost, gameState, songIndex, activeSong, isPlayingPhase, spotifyPlayer.deviceId]);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      spotifyPlayer.pauseTrack();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else if (activeSong) {
      const startOffset = activeSong.start_offset_ms || 0;
      if (spotifyPlayer.deviceId) {
        spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
      } else if (audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(true);
    }
  };

  return {
    spotifyPlayer,
    isPlaying,
    playbackMs,
    handleTogglePlayPause,
    audioRef,
  };
}
