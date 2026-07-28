import { useState, useEffect, useRef } from 'react';
import { RoundState } from '@spotify-music-quiz/shared/schema/game';
import { useQuizGame } from '#/features/game-player';

export function useGameTimer(
  onTimeExpired?: () => void,
) {
  const { gameState } = useQuizGame()
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasExpiredTriggeredRef = useRef<boolean>(false);

  const roundEndTime = gameState?.roundEndTime ?? null;
  const isGuessing = gameState?.roundState === RoundState.GUESSING;

  useEffect(() => {
    console.log('ISGUESSING', isGuessing, roundEndTime);

    if (!isGuessing || !roundEndTime) {
      setLocalTimeLeft(null);
      hasExpiredTriggeredRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remainingMs = Math.max(0, roundEndTime - now);
      const remainingSecs = Math.ceil(remainingMs / 1000);

      setLocalTimeLeft(remainingSecs);

      if (remainingMs <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (onTimeExpired && !hasExpiredTriggeredRef.current) {
          hasExpiredTriggeredRef.current = true;
          onTimeExpired();
        }
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 200);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [roundEndTime, isGuessing, onTimeExpired]);

  return {
    localTimeLeft,
    maxTimeLimit: gameState?.guessingTimeLimit ?? 30,
  };
}
