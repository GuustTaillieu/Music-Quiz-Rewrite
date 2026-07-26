import { useState, useEffect, useRef } from 'react';
import { useSpotifyPlayer } from '#/features/audio-player/hooks/useSpotifyPlayer';
import { useGlobalVolume } from '#/features/audio-player/hooks/useGlobalVolume';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import type { GameSessionState } from '@spotify-music-quiz/shared/schema/game';

export function useLobbyAudio(
  gameState: GameSessionState | null,
  isHost: boolean,
  onAudioStarted?: () => void,
) {
  const spotifyPlayer = useSpotifyPlayer(isHost);
  const [globalVolume] = useGlobalVolume();
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playedSongIndexRef = useRef<number | null>(null);

  useEffect(() => {
    spotifyPlayer.setVolume(globalVolume);
    if (audioRef.current) {
      audioRef.current.volume = globalVolume;
    }
  }, [globalVolume, spotifyPlayer.deviceId]);

  const activeSong = gameState?.activeSong;
  const songIndex = gameState?.currentSongIndex ?? null;
  const isPlayingPhase = gameState?.phase === 'SPEED_ROUND' || gameState?.phase === 'TURN_BASED';
  const isRevealed = gameState?.roundState === 'REVEALED';

  useEffect(() => {
    if (!isHost || !gameState || !isPlayingPhase || songIndex === null || !activeSong) {
      if (isHost && isPlaying && !isRevealed) {
        spotifyPlayer.pauseTrack();
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    // Only start snippet audio once per song index when player device or previewUrl is ready
    if (playedSongIndexRef.current === songIndex) {
      return;
    }

    const startOffset = activeSong.start_offset_ms || 0;
    const endOffset = activeSong.end_offset_ms || GAME_CONFIG.DEFAULT_SNIPPET_WINDOW_MS;
    const durationMs = Math.max(GAME_CONFIG.MIN_SNIPPET_WINDOW_MS, endOffset - startOffset);

    if (spotifyPlayer.deviceId) {
      playedSongIndexRef.current = songIndex;
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

      spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
      setIsPlaying(true);
      if (onAudioStarted) onAudioStarted();

      // Only auto-stop during guessing state; if revealed, host has full playback control
      if (!isRevealed) {
        stopTimeoutRef.current = setTimeout(() => {
          spotifyPlayer.pauseTrack();
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
        }, durationMs);
      }
    } else if (activeSong.previewUrl) {
      playedSongIndexRef.current = songIndex;
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = activeSong.previewUrl;
      audioRef.current.volume = globalVolume;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
      if (onAudioStarted) onAudioStarted();

      if (!isRevealed) {
        stopTimeoutRef.current = setTimeout(() => {
          spotifyPlayer.pauseTrack();
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
        }, durationMs);
      }
    }
  }, [isHost, gameState, songIndex, activeSong, isPlayingPhase, isRevealed, spotifyPlayer.deviceId]);

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
      if (spotifyPlayer.deviceId) {
        spotifyPlayer.resumeTrack().catch(() => {
          const startOffset = activeSong.start_offset_ms || 0;
          spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
        });
      } else if (audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(true);
    }
  };

  const restartSongAndTimer = () => {
    if (!isHost || !activeSong) return;
    playedSongIndexRef.current = null;
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

    const startOffset = activeSong.start_offset_ms || 0;
    if (spotifyPlayer.deviceId) {
      spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
    } else if (audioRef.current) {
      audioRef.current.currentTime = startOffset / 1000;
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(true);
    if (onAudioStarted) onAudioStarted();
  };

  const seekTrack = (targetMs: number) => {
    if (!isHost) return;
    if (spotifyPlayer.deviceId) {
      spotifyPlayer.seekTrack(targetMs);
    } else if (audioRef.current) {
      audioRef.current.currentTime = targetMs / 1000;
    }
  };

  return {
    spotifyPlayer,
    isPlaying: isPlaying || spotifyPlayer.isPlaying,
    currentPositionMs: spotifyPlayer.currentPositionMs,
    durationMs: spotifyPlayer.durationMs,
    handleTogglePlayPause,
    restartSongAndTimer,
    seekTrack,
    audioRef,
  };
}
