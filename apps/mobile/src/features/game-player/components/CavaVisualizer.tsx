import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface CavaVisualizerProps {
  isPlaying: boolean;
}

const BASE_HEIGHTS = [40, 70, 35, 90, 60, 80, 45, 100, 50, 75, 30, 85];

function CavaBar({ targetHeight, isPlaying, index }: { targetHeight: number; isPlaying: boolean; index: number }) {
  const scaleY = useSharedValue(0.2);

  useEffect(() => {
    if (isPlaying) {
      scaleY.value = withRepeat(
        withSequence(
          withTiming(targetHeight / 100, { duration: 300 + (index % 4) * 80 }),
          withTiming(0.2, { duration: 250 + (index % 3) * 70 })
        ),
        -1,
        true
      );
    } else {
      scaleY.value = withTiming(0.2, { duration: 300 });
    }
  }, [isPlaying, targetHeight, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 5,
          height: 40,
          borderRadius: 4,
          backgroundColor: isPlaying ? '#00f0ff' : 'rgba(0, 240, 255, 0.2)',
          marginHorizontal: 3,
        },
      ]}
    />
  );
}

export function CavaVisualizer({ isPlaying }: CavaVisualizerProps) {
  return (
    <View className="flex-row items-center justify-center h-12 py-1">
      {BASE_HEIGHTS.map((height, idx) => (
        <CavaBar key={idx} targetHeight={height} isPlaying={isPlaying} index={idx} />
      ))}
    </View>
  );
}
