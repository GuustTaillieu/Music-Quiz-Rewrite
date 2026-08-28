import { cn } from '@/features/shared';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import type { FlashBannerInfo } from '../hooks/useModeSwitchFlash';

interface ModeSwitchOverlayProps {
  banner: FlashBannerInfo | null;
}

export function ModeSwitchOverlay({ banner }: ModeSwitchOverlayProps) {
  if (!banner) return null;

  const isSpeed = banner.isSpeed;
  const textColorClass = isSpeed ? 'text-neon-pink' : 'text-neon-cyan';
  const borderClass = isSpeed ? 'border-[#ff007f]/50 bg-[#160614]/95' : 'border-[#00f0ff]/50 bg-[#04141e]/95';

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      pointerEvents="none"
      className="absolute top-14 left-4 right-4 z-50 items-center justify-center"
    >
      <View
        className={cn(
          'w-full max-w-sm px-5 py-3 rounded-2xl border items-center justify-center shadow-lg',
          borderClass
        )}
      >
        <Text
          className={cn(
            'text-xl font-extrabold uppercase tracking-widest text-center',
            textColorClass
          )}
        >
          {banner.message}
        </Text>
        <Text className="text-white/90 text-xs font-semibold text-center tracking-wide uppercase mt-0.5">
          {banner.subtext}
        </Text>
      </View>
    </Animated.View>
  );
}
