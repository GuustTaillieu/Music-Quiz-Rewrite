import { cn } from '@/features/shared';
import React from 'react';
import { Text, View } from 'react-native';
import { useGameTimer } from '../hooks/useGameTimer';

export function RoundProgressBar() {
  const { localTimeLeft, maxTimeLimit } = useGameTimer();

  const hasTimer = localTimeLeft !== null;
  const isTimeUp = localTimeLeft === 0;
  const isCritical = localTimeLeft !== null && localTimeLeft <= 5 && localTimeLeft > 0;
  const secondsLeft = localTimeLeft ?? 0;

  const progressPercent = hasTimer && maxTimeLimit > 0
    ? Math.max(0, Math.min(100, (secondsLeft / maxTimeLimit) * 100))
    : 100;

  if (!hasTimer) return null;

  return (
    <View className="w-full max-w-md mx-auto mb-3 px-1">
      <View className="flex-row items-center justify-between px-1 mb-1">
        <Text className={cn('text-[11px] font-extrabold tracking-wider', isCritical ? 'text-red-400' : 'text-neon-cyan')}>
          {isTimeUp ? "TIME'S UP!" : isCritical ? '⚠️ TIME RUNNING OUT' : 'TIME REMAINING'}
        </Text>
        <Text className={cn('text-xs font-black', isCritical ? 'text-red-400 font-black' : 'text-neon-cyan')}>
          {isTimeUp ? '0s' : `${secondsLeft}s`}
        </Text>
      </View>

      <View className="h-2.5 w-full bg-neon-cyan/10 rounded-full overflow-hidden border border-neon-cyan/20">
        <View
          className={cn(
            'h-full rounded-full',
            isTimeUp ? 'bg-red-600' : isCritical ? 'bg-red-500' : 'bg-neon-cyan'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </View>
  );
}
