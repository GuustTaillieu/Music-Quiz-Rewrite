import { usePlayerSession } from '@/features/game-player/hooks/usePlayerSession';
import { useQuizGame } from '@/features/game-player/hooks/useQuizGame';
import { cn, colors } from '@/features/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Headphones, LogIn, QrCode } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lobbyId?: string }>();
  const [code, setCode] = useState(params.lobbyId || '');
  const { username, setUsername } = usePlayerSession()
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
    if (cleanCode.length === 6 && cleanName.length > 2) {
      joinLobby(cleanCode);
    }
  };

  const isButtonDisabled = !code || !username || code.length !== 6 || username.length <= 2;

  return (
    <SafeAreaView className="flex-1 bg-bg-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="p-6 items-center">
          {/* LOGO */}
          <View className='items-center mb-8'>
            <View className="inline-flex items-center justify-center p-4 bg-spotify/10 rounded-2xl border border-spotify/30 text-spotify mb-3 shadow-[0_0_15px_rgba(29,185,84,0.15)]">
              <Headphones size={36} color={colors.spotify} />
            </View>
            <Text className="text-2xl font-bold tracking-tight text-white mb-0.5">SoundQuiz</Text>
            <Text className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-8">
              Powered by Spotify
            </Text>

          </View>

          <Text className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
            Music trivia, done right.
          </Text>

          <Text className="text-sm text-slate-400 text-center mb-6">Enter the 6-digit lobby code or scan host QR code</Text>

          {/* Scan QR Button */}
          <TouchableOpacity
            className="w-full flex-row items-center justify-center gap-2.5 bg-neon-cyan/8 border border-neon-cyan/40 py-3.5 rounded-2xl mb-5"
            onPress={() => router.push('/scanner')}
            activeOpacity={0.8}
          >
            <QrCode size={20} color="#00f0ff" />
            <Text className="text-neon-cyan font-bold text-base">Scan Host QR Code</Text>
          </TouchableOpacity>

          <View className="flex-row items-center w-full mb-5">
            <View className="flex-1 h-px bg-neon-cyan/15" />
            <Text className="text-slate-500 text-[10px] font-extrabold tracking-widest px-3">OR ENTER MANUALLY</Text>
            <View className="flex-1 h-px bg-neon-cyan/15" />
          </View>

          {/* Error Alert */}
          {error && (
            <View className="w-full bg-red-500/15 border border-red-500/40 p-3 rounded-xl mb-4">
              <Text className="text-red-400 text-xs text-center font-semibold">{error}</Text>
            </View>
          )}

          {/* Player Username Input */}
          <View className="w-full mb-4">
            <Text className="text-slate-400 text-[11px] font-extrabold tracking-wider mb-1.5">YOUR NICKNAME</Text>
            <TextInput
              className="w-full bg-card-dark border border-neon-cyan/25 rounded-xl px-4 py-3.5 text-white text-base font-semibold placeholder:text-slate-600"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your name"
              maxLength={20}
              autoCapitalize="words"
            />
          </View>

          {/* 6-Digit Code Input */}
          <View className="w-full mb-4">
            <Text className="text-slate-400 text-[11px] font-extrabold tracking-wider mb-1.5">LOBBY CODE</Text>
            <TextInput
              className="w-full bg-card-dark border border-neon-cyan/25 rounded-xl px-4 py-3.5 text-white text-base font-semibold placeholder:text-slate-600"
              value={code}
              onChangeText={(text) => setCode(text.slice(0, 6))}
              inputMode='decimal'
              returnKeyType='done'
              placeholder="XXXXXX"
              maxLength={6}
              autoCapitalize="characters"
            />
          </View>

          {/* Submit Join Button */}
          <TouchableOpacity
            className={cn(
              'w-full flex-row items-center justify-center gap-2 bg-neon-pink py-4 rounded-2xl mt-3',
              isButtonDisabled ? 'opacity-50' : 'opacity-100'
            )}
            onPress={handleJoin}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
          >
            <LogIn size={20} color="#ffffff" />
            <Text className="text-white text-base font-extrabold">Join Game</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
