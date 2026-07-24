import { useState, useEffect, useRef } from 'react';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import type { GameSessionState } from '@spotify-music-quiz/shared/schema/game';

export function useLobbyTimer(
  gameState: GameSessionState | null,
  forceRevealAnswer: () => void,
  isHost: boolean = false,
) {
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxTimeLimit = gameState?.guessingTimeLimit || GAME_CONFIG.DEFAULT_GUESSING_TIME_LIMIT_SECS;
  const roundEndTime = gameState?.roundEndTime;
  const isPlayingPhase = gameState?.phase === 'SPEED_ROUND' || gameState?.phase === 'TURN_BASED';
  const isRevealed = gameState?.roundState === 'REVEALED';

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!gameState || !isPlayingPhase || isRevealed) {
      setLocalTimeLeft(isRevealed ? 0 : maxTimeLimit);
      return;
    }

    // Audio hasn't started playing on host yet -> stay at max limit (paused)
    if (!roundEndTime) {
      setLocalTimeLeft(maxTimeLimit);
      return;
    }

    const calcRemaining = () => {
      const diffMs = roundEndTime - Date.now();
      return Math.max(0, Math.ceil(diffMs / 1000));
    };

    const initialSecs = calcRemaining();
    setLocalTimeLeft(initialSecs);

    if (initialSecs > 0) {
      timerIntervalRef.current = setInterval(() => {
        const remaining = calcRemaining();
        setLocalTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          if (isHost) {
            forceRevealAnswer();
          }
        }
      }, 250);
    } else {
      setLocalTimeLeft(0);
      if (isHost) {
        forceRevealAnswer();
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlayingPhase, isRevealed, roundEndTime, maxTimeLimit, isHost]);

  return {
    localTimeLeft,
    maxTimeLimit,
  };
}
