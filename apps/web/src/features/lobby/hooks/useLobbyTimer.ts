import { useState, useEffect, useRef } from 'react';
import { LOBBY_CONSTANTS } from '../constants/lobbyConstants';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import type { GameState } from '@spotify-music-quiz/shared/schema/game';

export function useLobbyTimer(gameState: GameState | null, forceRevealAnswer: () => void) {
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameState?.guessingTimeRemainingSecs !== undefined && gameState?.guessingTimeRemainingSecs !== null) {
      setLocalTimeLeft(gameState.guessingTimeRemainingSecs);
    }
  }, [gameState?.guessingTimeRemainingSecs]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (gameState?.status === 'PLAYING' && localTimeLeft !== null && localTimeLeft > 0) {
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
  }, [gameState?.status, localTimeLeft === 0]);

  const maxTimeLimit = gameState?.guessingTimeLimitSecs || GAME_CONFIG.DEFAULT_GUESSING_TIME_LIMIT_SECS;

  return {
    localTimeLeft,
    maxTimeLimit,
  };
}
