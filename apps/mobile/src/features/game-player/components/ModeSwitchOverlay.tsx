import { cn } from '@/features/shared';
import React from 'react';
import { Text, View } from 'react-native';
import type { FlashBannerInfo } from '../hooks/useModeSwitchFlash';

interface ModeSwitchOverlayProps {
  banner: FlashBannerInfo | null;
}

export function ModeSwitchOverlay({ banner }: ModeSwitchOverlayProps) {
  if (!banner) return null;

  const isSpeed = banner.isSpeed;
  const borderColorClass = isSpeed ? 'border-neon-pink' : 'border-neon-cyan';
  const textColorClass = isSpeed ? 'text-neon-pink' : 'text-neon-cyan';
  const bgGlowClass = isSpeed ? 'bg-pink-600/35' : 'bg-cyan-500/35';

  return (
    <View
      pointerEvents="none"
      className={cn(
        'absolute inset-0 z-50 bg-black/75 items-center justify-center p-6 border-[16px]',
        borderColorClass,
        bgGlowClass
      )}
    >
      <View className="items-center justify-center gap-3">
        <Text
          className={cn(
            'text-4xl font-black uppercase tracking-widest text-center',
            textColorClass
          )}
        >
          {banner.message}
        </Text>
        <Text className="text-white text-base font-black text-center tracking-wide">
          {banner.subtext}
        </Text>
      </View>
    </View>
  );
}
