import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, Camera } from 'lucide-react-native';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={48} color="#00f0ff" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSubtitle}>
          We need your permission to use the camera to scan host lobby QR codes.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
    <View style={styles.container}>
      <CameraComponent
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan Host QR Code</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Scanner Box Frame */}
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstructions}>
              Position the host screen QR code inside the frame
            </Text>
          </View>

          <View style={styles.footer} />
        </View>
      </CameraComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#05070f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  grantButton: {
    width: '100%',
    backgroundColor: '#00f0ff',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  grantButtonText: {
    color: '#05070f',
    fontWeight: '800',
    fontSize: 15,
  },
  cancelButton: {
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.6)',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  scanFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#00f0ff',
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  scanInstructions: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  footer: {
    height: 40,
  },
});
