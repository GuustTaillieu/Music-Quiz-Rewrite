import { useState, useEffect, useRef } from 'react';
import { RoundState, type GameSessionState } from '@spotify-music-quiz/shared/schema/game';

export function useLobbyTimer(
  gameState: GameSessionState | null,
  onTimeExpired?: () => void,
  isHost?: boolean,
) {
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasExpiredTriggeredRef = useRef<boolean>(false);

  const roundEndTime = gameState?.roundEndTime ?? null;
  const isGuessing = gameState?.roundState === RoundState.GUESSING;

  useEffect(() => {
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
        if (isHost && onTimeExpired && !hasExpiredTriggeredRef.current) {
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
  }, [roundEndTime, isGuessing, isHost, onTimeExpired]);

  return {
    localTimeLeft,
    maxTimeLimit: gameState?.guessingTimeLimit ?? 30,
  };
}
