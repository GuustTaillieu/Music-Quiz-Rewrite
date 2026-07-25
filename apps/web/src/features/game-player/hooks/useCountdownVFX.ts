import { useMemo } from 'react';

export function useCountdownVFX(localTimeLeft: number | null | undefined) {
  return useMemo(() => {
    const hasTimer = localTimeLeft !== null && localTimeLeft !== undefined;
    const isTimeUp = hasTimer && localTimeLeft === 0;
    const isCritical = hasTimer && localTimeLeft <= 5 && localTimeLeft > 0;
    const secondsLeft = hasTimer ? localTimeLeft : null;

    return {
      hasTimer,
      isTimeUp,
      isCritical,
      secondsLeft,
    };
  }, [localTimeLeft]);
}
