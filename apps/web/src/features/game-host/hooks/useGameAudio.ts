import { useEffect, useRef } from 'react';
import { useSpotifyPlayer } from '#/features/audio-player';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import { GamePhase, RoundState } from '@spotify-music-quiz/shared/schema/game';
import { useQuizGame } from '#/features/game-player';

export function useGameAudio() {
  const { gameState, startAudioTimer } = useQuizGame()
  const spotifyPlayer = useSpotifyPlayer();

  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playedSongIndexRef = useRef<number | null>(null);

  const isReady = spotifyPlayer.isReady;
  const activeSong = gameState?.activeSong;
  const songIndex = gameState?.currentSongIndex ?? null;
  const isPlayingPhase = gameState?.phase === GamePhase.SPEED_ROUND || gameState?.phase === GamePhase.TURN_BASED;
  const isRevealed = gameState?.roundState === RoundState.REVEALED;

  useEffect(() => {
    if (!isReady || !isPlayingPhase || songIndex === null || !activeSong) {
      if (spotifyPlayer.isPlaying) {
        spotifyPlayer.pauseTrack();
      }
      return;
    }

    if (playedSongIndexRef.current === songIndex) {
      return;
    }

    const startOffset = activeSong.start_offset_ms || 0;
    const endOffset = activeSong.end_offset_ms || GAME_CONFIG.DEFAULT_SNIPPET_WINDOW_MS;
    const durationMs = Math.max(GAME_CONFIG.MIN_SNIPPET_WINDOW_MS, endOffset - startOffset);

    playedSongIndexRef.current = songIndex;
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

    spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
    startAudioTimer()

    if (!isRevealed) {
      stopTimeoutRef.current = setTimeout(() => {
        spotifyPlayer.pauseTrack();
      }, durationMs);
    } else {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    }
    return () => {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, [songIndex, activeSong, isPlayingPhase, isRevealed, spotifyPlayer.deviceId, isReady]);

  const restartSongAndTimer = () => {
    if (!activeSong) return;
    playedSongIndexRef.current = null;
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

    const startOffset = activeSong.start_offset_ms || 0;
    spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);
    startAudioTimer();
  };

  return {
    restartSongAndTimer,
  };
}
