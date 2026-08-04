import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const scanLinePos = useSharedValue(0);

  useEffect(() => {
    scanLinePos.value = withRepeat(
      withTiming(230, { duration: 2000, easing: Easing.linear }),
      -1,
      true
    );
  }, [scanLinePos]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePos.value }],
  }));

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-bg-dark items-center justify-center p-6">
        <Camera size={48} color="#00f0ff" />
        <Text className="text-2xl font-extrabold text-white mt-4 mb-2">Camera Access Required</Text>
        <Text className="text-sm text-slate-400 text-center mb-6">
          We need your permission to use the camera to scan host lobby QR codes.
        </Text>
        <TouchableOpacity className="w-full bg-neon-cyan py-3.5 rounded-2xl items-center mb-3" onPress={requestPermission}>
          <Text className="text-bg-dark font-extrabold text-base">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity className="py-2.5" onPress={() => router.back()}>
          <Text className="text-slate-400 text-sm font-semibold">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    let code = data.trim();
    if (code.includes('lobbyId=')) {
      const urlParams = new URLSearchParams(code.slice(code.indexOf('?')));
      const parsed = urlParams.get('lobbyId');
      if (parsed) code = parsed;
    } else if (code.includes('/')) {
      const parts = code.split('/');
      code = parts[parts.length - 1];
    }

    const cleanCode = code.replace(/[^0-9A-Za-z]/g, '').slice(0, 6).toUpperCase();

    if (cleanCode.length === 6) {
      router.replace(`/join?lobbyId=${cleanCode}`);
    } else {
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const CameraComponent = CameraView as unknown as React.FC<any>;

  return (
    <View className="flex-1 bg-black">
      <CameraComponent
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* 4-Panel Dark Viewport Mask (Center Viewport is 100% Clear) */}
        <View className="flex-1">
          {/* Top Dimmed Overlay with Header */}
          <View className="flex-1 bg-black/75 pt-12 px-6 justify-between pb-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-lg font-extrabold tracking-wide">Scan Host QR Code</Text>
              <TouchableOpacity className="p-2 bg-white/15 rounded-full" onPress={() => router.back()}>
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Middle Row with Center Cutout */}
          <View className="flex-row h-64">
            {/* Left Dimmed Overlay */}
            <View className="flex-1 bg-black/75" />

            {/* Clear Viewport Square Box (64x64 / 256px) */}
            <View className="w-64 h-64 relative items-center justify-center">
              {/* L-Shaped Glowing Neon Corner Brackets */}
              <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-neon-cyan rounded-tl-xl" />
              <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-neon-cyan rounded-tr-xl" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-neon-cyan rounded-bl-xl" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-neon-cyan rounded-br-xl" />

              {/* Animated Glowing Scan Line */}
              <Animated.View
                style={[scanLineStyle]}
                className="absolute top-2 left-3 right-3 h-0.5 bg-neon-cyan shadow-md shadow-neon-cyan"
              />
            </View>

            {/* Right Dimmed Overlay */}
            <View className="flex-1 bg-black/75" />
          </View>

          {/* Bottom Dimmed Overlay with Instruction */}
          <View className="flex-1 bg-black/75 items-center justify-center p-6">
            <Text className="text-slate-200 text-sm font-bold text-center tracking-wide">
              Position the host screen QR code inside the frame
            </Text>
          </View>
        </View>
      </CameraComponent>
    </View>
  );
}
