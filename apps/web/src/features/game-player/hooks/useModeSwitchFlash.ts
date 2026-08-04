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
  const prevIsSpeedRef = useRef<boolean | null>(null);

  const isSpeedMode = gameState
    ? gameState.gameMode === GameMode.SPEED_MODE || gameState.phase === GamePhase.SPEED_ROUND
    : false;

  useEffect(() => {
    if (!gameState) return;

    // Ignore transitions in Lobby or Completed phase
    if (gameState.phase === GamePhase.LOBBY || gameState.phase === GamePhase.COMPLETED) {
      prevIsSpeedRef.current = isSpeedMode;
      return;
    }

    const prevIsSpeed = prevIsSpeedRef.current;

    // Trigger flash when game starts OR when mode/phase switches
    if (prevIsSpeed === null || prevIsSpeed !== isSpeedMode) {
      if (isSpeedMode) {
        setFlashBanner({
          message: '⚡ SPEED ROUND',
          subtext: 'Everyone can guess now!',
          isSpeed: true,
        });
      } else {
        setFlashBanner({
          message: '🎯 TURN-BASED MODE',
          subtext: "Take turns to guess when it's your turn!",
          isSpeed: false,
        });
      }
      const timer = setTimeout(() => setFlashBanner(null), 3000);
      return () => clearTimeout(timer);
    }

    prevIsSpeedRef.current = isSpeedMode;
  }, [gameState, isSpeedMode]);

  return {
    flashBanner,
    isSpeedMode,
    clearFlash: () => setFlashBanner(null),
  };
}
