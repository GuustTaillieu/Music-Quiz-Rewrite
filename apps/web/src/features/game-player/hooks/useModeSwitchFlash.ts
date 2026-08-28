import { useEffect, useRef, useState } from 'react';
import { GameMode, GamePhase } from '@spotify-music-quiz/shared/schema/game';
import { useQuizGame } from '#/features/game-session/hooks/useQuizGame';

export interface FlashBannerInfo {
  message: string;
  subtext: string;
  isSpeed: boolean;
}

export function useModeSwitchFlash() {
  const { gameState } = useQuizGame();
  const [flashBanner, setFlashBanner] = useState<FlashBannerInfo | null>(null);
  const prevActivePhaseRef = useRef<GamePhase | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const phase = gameState?.phase;
  const gameMode = gameState?.gameMode;

  const isSpeedMode = gameState
    ? gameMode === GameMode.SPEED_MODE || phase === GamePhase.SPEED_ROUND
    : false;

  useEffect(() => {
    if (!phase) return;

    // Reset when in Lobby or Completed phase
    if (phase === GamePhase.LOBBY || phase === GamePhase.COMPLETED) {
      prevActivePhaseRef.current = null;
      setFlashBanner(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const prevActivePhase = prevActivePhaseRef.current;

    // Initial game start: record active phase without triggering HUD banner
    if (!prevActivePhase) {
      prevActivePhaseRef.current = phase;
      return;
    }

    // Mid-game switch between Speed Round and Turn-Based:
    if (prevActivePhase !== phase) {
      prevActivePhaseRef.current = phase;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setFlashBanner({
        message: isSpeedMode ? '⚡ SPEED ROUND' : '🎯 TURN-BASED MODE',
        subtext: isSpeedMode ? 'Everyone can guess now!' : 'Answer one at a time',
        isSpeed: isSpeedMode,
      });

      timerRef.current = setTimeout(() => {
        setFlashBanner(null);
        timerRef.current = null;
      }, 1000);
    }
  }, [phase, isSpeedMode]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    flashBanner,
    isSpeedMode,
    clearFlash: () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setFlashBanner(null);
    },
  };
}
