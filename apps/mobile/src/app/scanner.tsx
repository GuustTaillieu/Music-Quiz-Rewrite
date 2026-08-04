import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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
        <View className="flex-1 bg-bg-dark/60 justify-between pt-12 pb-10 px-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-lg font-extrabold">Scan Host QR Code</Text>
            <TouchableOpacity className="p-2 bg-white/15 rounded-full" onPress={() => router.back()}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Scanner Box Frame */}
          <View className="items-center justify-center">
            <View className="w-60 h-60 border-3 border-neon-cyan rounded-3xl bg-transparent shadow-lg shadow-neon-cyan" />
            <Text className="text-slate-200 text-xs font-semibold mt-5 text-center">
              Position the host screen QR code inside the frame
            </Text>
          </View>

          <View className="h-10" />
        </View>
      </CameraComponent>
    </View>
  );
}
