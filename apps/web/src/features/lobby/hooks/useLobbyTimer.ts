import { useState, useEffect, useRef } from 'react';
import { LOBBY_CONSTANTS } from '../constants/lobbyConstants';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import type { GameSessionState } from '@spotify-music-quiz/shared/schema/game';

export function useLobbyTimer(gameState: GameSessionState | null, forceRevealAnswer: () => void) {
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxTimeLimit = gameState?.guessingTimeLimit || GAME_CONFIG.DEFAULT_GUESSING_TIME_LIMIT_SECS;

  useEffect(() => {
    if (gameState?.guessingTimeLimit) {
      setLocalTimeLeft(gameState.guessingTimeLimit);
    }
  }, [gameState?.guessingTimeLimit]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const isPlayingPhase = gameState?.phase === 'SPEED_ROUND' || gameState?.phase === 'TURN_BASED';
    if (isPlayingPhase && localTimeLeft !== null && localTimeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setLocalTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            forceRevealAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, LOBBY_CONSTANTS.TIMER_INTERVAL_MS);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState?.phase, localTimeLeft === 0]);

  return {
    localTimeLeft,
    maxTimeLimit,
  };
}
