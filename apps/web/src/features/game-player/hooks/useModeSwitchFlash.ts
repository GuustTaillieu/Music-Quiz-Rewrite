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
  const prevPhaseRef = useRef<GamePhase | null>(null);

  const phase = gameState?.phase;
  const gameMode = gameState?.gameMode;

  const isSpeedMode = gameState
    ? gameMode === GameMode.SPEED_MODE || phase === GamePhase.SPEED_ROUND
    : false;

  useEffect(() => {
    if (!phase) return;

    // Ignore transitions in Lobby or Completed phase
    if (phase === GamePhase.LOBBY || phase === GamePhase.COMPLETED) {
      prevPhaseRef.current = phase;
      return;
    }

    const prevPhase = prevPhaseRef.current;

    // Trigger flash when game first starts or when phase/mode changes between speed & turn-based
    if (prevPhase !== phase) {
      if (isSpeedMode) {
        setFlashBanner({
          message: '⚡ SPEED ROUND',
          subtext: 'Everyone can guess now!',
          isSpeed: true,
        });
      } else {
        setFlashBanner({
          message: '🎯 TURN-BASED MODE',
          subtext: 'Answer one at a time',
          isSpeed: false,
        });
      }
      const timer = setTimeout(() => setFlashBanner(null), 3000);
      prevPhaseRef.current = phase;
      return () => clearTimeout(timer);
    }

    prevPhaseRef.current = phase;
  }, [phase, isSpeedMode]);

  return {
    flashBanner,
    isSpeedMode,
    clearFlash: () => setFlashBanner(null),
  };
}
