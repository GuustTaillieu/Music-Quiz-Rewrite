import { usePlayerSession } from '@/features/game-player/hooks/usePlayerSession';
import { useQuizGame } from '@/features/game-player/hooks/useQuizGame';
import { cn } from '@/features/shared';
import { GamePhase } from '@spotify-music-quiz/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Crown, LogOut, Send, SkipForward, Trophy, Users, Zap } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LobbyScreen() {
  const router = useRouter();
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const { username } = usePlayerSession()
  const { gameState, leaveLobby, passTurn, submitGuess, lastGuessResult } = useQuizGame();

  const [guessText, setGuessText] = useState('');
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);

  const handleLeave = () => {
    leaveLobby(() => {
      router.replace('/join');
    });
  };

  const handleSubmit = () => {
    if (guessText.trim()) {
      submitGuess(guessText.trim());
      setGuessText('');
      setIsGuessModalOpen(false);
    }
  };

  if (!gameState) {
    return (
      <SafeAreaView className="flex-1 bg-bg-dark items-center justify-center">
        <Text className="text-neon-cyan text-base font-bold">Connecting to lobby {lobbyId}...</Text>
      </SafeAreaView>
    );
  }

  const isLobby = gameState.phase === GamePhase.LOBBY;
  const isPlaying = gameState.phase === GamePhase.TURN_BASED || gameState.phase === GamePhase.SPEED_ROUND;
  const isFinished = gameState.phase === GamePhase.COMPLETED;

  return (
    <SafeAreaView className="flex-1 bg-bg-dark">
      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-neon-cyan/15">
        <View className="flex-row items-center gap-2">
          <Text className="text-neon-cyan text-lg font-black tracking-widest">{username}</Text>
        </View>

        <TouchableOpacity className="flex-row items-center gap-1.5 bg-red-500/12 px-3 py-1.5 rounded-xl" onPress={handleLeave}>
          <LogOut size={16} color="#f87171" />
          <Text className="text-red-400 text-xs font-bold">Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Result Toast Alert */}
      {lastGuessResult !== null && (
        <View className={cn('py-2.5 items-center', lastGuessResult ? 'bg-green-500/20' : 'bg-red-500/20')}>
          <Text className="text-white font-extrabold text-sm">
            {lastGuessResult ? '🎉 CORRECT GUESS!' : '❌ INCORRECT GUESS'}
          </Text>
        </View>
      )}

      {/* Content Body based on Game Phase */}
      {isLobby && (
        <View className="flex-1 p-5">
          <View className="items-center mb-6">
            <Users size={28} color="#00f0ff" />
            <Text className="text-white text-2xl font-black mt-2.5">Waiting for Host to Start</Text>
            <Text className="text-slate-400 text-xs mt-1">
              {gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''} in lobby
            </Text>
          </View>

          <ScrollView contentContainerClassName="gap-2.5">
            {gameState.players.map((p) => (
              <View
                key={p.id}
                className={cn(
                  'flex-row items-center justify-between bg-card-dark border border-neon-cyan/20 p-3.5 rounded-2xl',
                  p.isDisconnected && 'opacity-50'
                )}
              >
                <View className="flex-row items-center gap-2">
                  {p.isHost && <Crown size={18} color="#f59e0b" />}
                  <Text className="text-white font-bold text-base">{p.name}</Text>
                </View>
                <Text className="text-slate-500 text-[11px] font-extrabold">
                  {p.isDisconnected ? 'Reconnecting...' : p.isHost ? 'HOST' : 'PLAYER'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {isPlaying && (
        <View className="flex-1 p-5">
          <View className="self-center bg-neon-cyan/10 border border-neon-cyan/30 px-4 py-1.5 rounded-full mb-8">
            <Text className="text-neon-cyan font-black text-xs tracking-widest">
              SONG {gameState.currentSongIndex + 1} OF {gameState.totalSongs}
            </Text>
          </View>

          {/* Buzzer Area */}
          <View className="flex-1 items-center justify-center">
            <TouchableOpacity
              className="w-55 h-55 rounded-full bg-neon-pink items-center justify-center gap-2 shadow-lg shadow-neon-pink/80 mb-8"
              onPress={() => setIsGuessModalOpen(true)}
              activeOpacity={0.85}
            >
              <Zap size={48} color="#ffffff" />
              <Text className="text-white text-2xl font-black tracking-widest">BUZZ IN</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center gap-1.5 px-4 py-2.5" onPress={passTurn} activeOpacity={0.8}>
              <SkipForward size={18} color="#94a3b8" />
              <Text className="text-slate-400 font-bold text-sm">Pass Turn</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isFinished && (
        <View className="flex-1 p-5">
          <View className="items-center mb-6">
            <Trophy size={40} color="#f59e0b" />
            <Text className="text-white text-2xl font-black mt-2.5">Game Over!</Text>
            <Text className="text-slate-400 text-xs mt-1">Final Scoreboard</Text>
          </View>

          <ScrollView contentContainerClassName="gap-2">
            {gameState.players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((p, index) => (
                <View key={p.id} className="flex-row items-center justify-between bg-card-dark p-3.5 rounded-2xl mb-2">
                  <Text className="text-neon-cyan font-black text-base w-10">#{index + 1}</Text>
                  <Text className="flex-1 text-white font-bold text-base">{p.name}</Text>
                  <Text className="text-neon-pink font-black text-base">{p.score} pts</Text>
                </View>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Guess Input Modal */}
      <Modal visible={isGuessModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-bg-dark/85 justify-center p-6">
          <View className="bg-card-dark border-1.5 border-neon-cyan/40 rounded-3xl p-6">
            <Text className="text-white text-xl font-black mb-4 text-center">Enter Your Guess</Text>

            <TextInput
              className="bg-bg-dark border border-neon-cyan/30 rounded-xl px-4 py-3.5 text-white text-base mb-5"
              value={guessText}
              onChangeText={setGuessText}
              placeholder="Song title or artist..."
              placeholderTextColor="#4a5568"
              autoFocus
            />

            <View className="gap-2.5">
              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 bg-neon-pink py-3.5 rounded-xl"
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Send size={18} color="#ffffff" />
                <Text className="text-white font-extrabold text-base">Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center py-2.5"
                onPress={() => setIsGuessModalOpen(false)}
              >
                <Text className="text-slate-400 font-semibold text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
