import { useQuizGame } from '@/features/game-player/hooks/useQuizGame';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LogIn, Music, QrCode } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lobbyId?: string }>();
  const [code, setCode] = useState(params.lobbyId || '');
  const [username, setUsername] = useState('');
  const { joinLobby, gameState, error } = useQuizGame();

  useEffect(() => {
    if (params.lobbyId) {
      setCode(params.lobbyId.toUpperCase());
    }
  }, [params.lobbyId]);

  useEffect(() => {
    if (gameState && gameState.lobbyId === code.toUpperCase()) {
      router.push(`/lobby/${code.toUpperCase()}`);
    }
  }, [gameState, code, router]);

  const handleJoin = () => {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = username.trim();
    if (cleanCode.length === 6 && cleanName) {
      joinLobby(cleanCode, cleanName);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Badge */}
        <View style={styles.badgeContainer}>
          <Music size={24} color="#00f0ff" />
          <Text style={styles.badgeText}>SPOTIFY MUSIC QUIZ</Text>
        </View>

        <Text style={styles.title}>Join Lobby</Text>
        <Text style={styles.subtitle}>Enter the 6-digit lobby code or scan host QR code</Text>

        {/* Scan QR Button */}
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => router.push('/scanner')}
          activeOpacity={0.8}
        >
          <QrCode size={20} color="#00f0ff" />
          <Text style={styles.qrButtonText}>Scan Host QR Code</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Error Alert */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 6-Digit Code Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>LOBBY CODE</Text>
          <TextInput
            style={styles.textInput}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="XXXXXX"
            placeholderTextColor="#4a5568"
            maxLength={6}
            autoCapitalize="characters"
            keyboardType="default"
          />
        </View>

        {/* Player Username Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>YOUR NICKNAME</Text>
          <TextInput
            style={styles.textInput}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your name"
            placeholderTextColor="#4a5568"
            maxLength={20}
            autoCapitalize="words"
          />
        </View>

        {/* Submit Join Button */}
        <TouchableOpacity
          style={[
            styles.joinButton,
            (!code || !username || code.length !== 6) && styles.joinButtonDisabled,
          ]}
          onPress={handleJoin}
          disabled={!code || !username || code.length !== 6}
          activeOpacity={0.8}
        >
          <LogIn size={20} color="#ffffff" />
          <Text style={styles.joinButtonText}>Join Game</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070f',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeText: {
    color: '#00f0ff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  qrButtonText: {
    color: '#00f0ff',
    fontWeight: '700',
    fontSize: 15,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    paddingHorizontal: 12,
  },
  errorCard: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    backgroundColor: '#0d1322',
    borderColor: 'rgba(0, 240, 255, 0.25)',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff007f',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
