import { cn } from '@/features/shared';
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { FlashBannerInfo } from '../hooks/useModeSwitchFlash';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModeSwitchOverlayProps {
  banner: FlashBannerInfo | null;
}

export function ModeSwitchOverlay({ banner }: ModeSwitchOverlayProps) {
  if (!banner) return null;

  const isSpeed = banner.isSpeed;
  const glowHex = isSpeed ? '#ff007f' : '#00f0ff';
  const textColorClass = isSpeed ? 'text-neon-pink' : 'text-neon-cyan';

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      exiting={FadeOut.duration(350)}
      pointerEvents="none"
      className="absolute inset-0 z-50 items-center justify-center bg-black/60"
    >
      {/* Full-Screen Radial Edge Glow SVG Overlay */}
      <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} className="absolute inset-0">
        <Defs>
          <RadialGradient
            id="edgeGlow"
            cx="50%"
            cy="50%"
            rx="75%"
            ry="75%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.2" />
            <Stop offset="55%" stopColor={glowHex} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={glowHex} stopOpacity="0.95" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#edgeGlow)" />
      </Svg>

      {/* Center HUD Text */}
      <View className="absolute inset-0 items-center justify-center gap-3 px-6 z-10">
        <Text
          className={cn(
            'text-4xl font-bold uppercase tracking-widest text-center drop-shadow-2xl',
            textColorClass
          )}
        >
          {banner.message}
        </Text>
        <Text className="text-white text-base font-semibold text-center tracking-wide uppercase drop-shadow-md">
          {banner.subtext}
        </Text>
      </View>
    </Animated.View>
  );
}
