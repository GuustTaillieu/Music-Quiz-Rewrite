import { CavaVisualizer } from '@/features/game-player/components/CavaVisualizer';
import { PlayerHeaderBar } from '@/features/game-player/components/PlayerHeaderBar';
import { RoundProgressBar } from '@/features/game-player/components/RoundProgressBar';
import { RoundSummaryCard } from '@/features/game-player/components/RoundSummaryCard';
import { usePlayerSession } from '@/features/game-player/hooks/usePlayerSession';
import { useQuizGame } from '@/features/game-player/hooks/useQuizGame';
import { getQuestionTypeLabel } from '@/features/game-player/utils/question-type-text';
import { cn } from '@/features/shared';
import { GamePhase, RoundState } from '@spotify-music-quiz/shared/schema/game';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, Send, Sparkles, Trophy, Users, XCircle } from 'lucide-react-native';
import { useState } from 'react';
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

import { ModeSwitchOverlay } from '@/features/game-player/components/ModeSwitchOverlay';
import { useModeSwitchFlash } from '@/features/game-player/hooks/useModeSwitchFlash';

export default function LobbyScreen() {
  const router = useRouter();
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const { username } = usePlayerSession();
  const { gameState, leaveLobby, submitGuess, passTurn, lastGuessResult } = useQuizGame();
  const { flashBanner, isSpeedMode } = useModeSwitchFlash();

  const [guessText, setGuessText] = useState('');

  const handleLeave = () => {
    leaveLobby(() => {
      router.replace('/join');
    });
  };

  const handleSubmit = () => {
    if (guessText.trim()) {
      submitGuess(guessText.trim());
      setGuessText('');
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
  const isRevealed = gameState.roundState === RoundState.REVEALED;

  const currentPlayer = gameState.players.find(
    (p) => p.name.toLowerCase() === username.trim().toLowerCase()
  );
  const currentPlayerId = currentPlayer?.id;

  const hasAlreadyGuessed = currentPlayerId
    ? gameState.playersGuessed.includes(currentPlayerId)
    : false;

  const isMyTurn = isSpeedMode
    ? true
    : currentPlayerId
      ? gameState.activePlayerId === currentPlayerId
      : false;

  const activeTurnPlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);
  const lastRoundWinner = gameState.players.find((p) => p.id === gameState.lastRoundWinnerId) || null;

  const isDisabled = !isPlaying || isRevealed;

  return (
    <SafeAreaView className="flex-1 bg-bg-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 20}
        className="flex-1 px-5 pt-3"
      >
        {/* Top Header Bar */}
        <PlayerHeaderBar username={username} players={gameState.players} onLeave={handleLeave} />

        {/* Videogame Full-Screen Edge Glow Overlay */}
        <ModeSwitchOverlay banner={flashBanner} />

        {/* Result Toast Alert */}
        {lastGuessResult !== null && (
          <View className={cn('py-2 items-center rounded-xl my-2', lastGuessResult ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30')}>
            <Text className="text-white font-black text-xs">
              {lastGuessResult ? '🎉 CORRECT GUESS! (+1 PT)' : '❌ INCORRECT GUESS'}
            </Text>
          </View>
        )}

        {/* LOBBY PHASE */}
        {isLobby && (
          <View className="flex-1 p-4 justify-between">
            <View className="items-center mt-6">
              <Users size={36} color="#00f0ff" />
              <Text className="text-white text-2xl font-black mt-3">Waiting for Host to Start</Text>
              <Text className="text-slate-400 text-xs mt-1 font-semibold">
                {gameState.players.filter((p) => !p.isHost).length} contestant(s) ready in lobby
              </Text>
            </View>

            <ScrollView contentContainerClassName="gap-2.5 my-4" className="flex-1">
              {gameState.players
                .filter((p) => !p.isHost)
                .map((p) => (
                  <View
                    key={p.id}
                    className={cn(
                      'flex-row items-center justify-between bg-card-dark border border-neon-cyan/20 p-3.5 rounded-2xl',
                      p.isDisconnected && 'opacity-50'
                    )}
                  >
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-neon-cyan/15 border border-neon-cyan/30 items-center justify-center">
                        <Text className="text-neon-cyan font-black text-xs">{p.name.slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <Text className="text-white font-bold text-base">{p.name}</Text>
                    </View>
                    <Text className="text-slate-500 text-[11px] font-extrabold">
                      {p.isDisconnected ? 'Reconnecting...' : 'READY'}
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        )}

        {/* PLAYING PHASE */}
        {isPlaying && (
          <View className="flex-1 justify-between py-2">
            {/* Round Summary Card overlay on Reveal */}
            {isRevealed ? (
              <RoundSummaryCard activeSong={gameState.activeSong} lastRoundWinner={lastRoundWinner} username={username} />
            ) : (
              /* Center Visualizer Area */
              <View className="flex-1 items-center justify-center py-4">
                <View className="bg-neon-cyan/10 border border-neon-cyan/30 px-4 py-1.5 rounded-full mb-4">
                  <Text className="text-neon-cyan font-black text-xs tracking-widest">
                    {getQuestionTypeLabel(gameState.activeSong?.questionType)}
                  </Text>
                </View>

                <CavaVisualizer isPlaying={true} />

                {isSpeedMode && (
                  <View className="flex-row items-center gap-1.5 bg-neon-pink/15 border border-neon-pink/30 px-3 py-1 rounded-full mt-4">
                    <Sparkles size={14} color="#ff007f" />
                    <Text className="text-neon-pink text-xs font-black tracking-wider">SPEED ROUND - ANYONE CAN GUESS!</Text>
                  </View>
                )}
              </View>
            )}

            {/* Integrated Round Progress Bar */}
            <RoundProgressBar />

            {/* Footer Action Input Container */}
            <View className="bg-card-dark border border-neon-cyan/30 rounded-3xl p-4 mb-2 shadow-2xl">
              {hasAlreadyGuessed && !isRevealed ? (
                <View className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl items-center gap-1">
                  <View className="flex-row items-center gap-2">
                    <XCircle size={18} color="#f87171" />
                    <Text className="text-red-400 font-black text-xs uppercase tracking-wider">Incorrect Answer</Text>
                  </View>
                  <Text className="text-red-300/80 text-xs font-medium text-center">
                    Your guess was incorrect. Please wait for the round to end...
                  </Text>
                </View>
              ) : !isSpeedMode && !isMyTurn && !isRevealed ? (
                <View className="p-3.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-2xl items-center gap-1">
                  <View className="flex-row items-center gap-2">
                    <Clock size={16} color="#00f0ff" />
                    <Text className="text-neon-cyan font-bold text-xs uppercase tracking-wider">Waiting for Turn</Text>
                  </View>
                  <Text className="text-slate-300 text-xs font-medium text-center">
                    It is currently <Text className="text-white font-bold">{activeTurnPlayer?.name || 'another player'}</Text>'s turn to guess!
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-bg-dark border border-neon-cyan/30 rounded-2xl px-4 py-3 text-white text-base font-semibold"
                    placeholder="Type your guess here..."
                    placeholderTextColor="#64748b"
                    value={guessText}
                    onChangeText={setGuessText}
                    editable={!isDisabled}
                    autoFocus={!isDisabled}
                    onSubmitEditing={handleSubmit}
                  />
                  {!isSpeedMode && (
                    <TouchableOpacity
                      className={cn(
                        'px-4 py-3.5 bg-card-dark border border-neon-cyan/40 rounded-2xl items-center justify-center',
                        isDisabled && 'opacity-50'
                      )}
                      onPress={passTurn}
                      disabled={isDisabled}
                      activeOpacity={0.8}
                    >
                      <Text className="text-neon-cyan font-bold text-xs">Pass</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    className={cn(
                      'p-3.5 bg-neon-pink rounded-2xl items-center justify-center',
                      isDisabled && 'opacity-50'
                    )}
                    onPress={handleSubmit}
                    disabled={isDisabled}
                    activeOpacity={0.8}
                  >
                    <Send size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* FINISHED PHASE */}
        {isFinished && (
          <View className="flex-1 p-4 justify-between">
            <View className="items-center mt-4">
              <Trophy size={48} color="#f59e0b" />
              <Text className="text-white text-3xl font-black mt-2">Game Over!</Text>
              <Text className="text-slate-400 text-xs mt-1 font-semibold">Final Leaderboard</Text>
            </View>

            <ScrollView contentContainerClassName="gap-2.5 my-4" className="flex-1">
              {gameState.players
                .filter((p) => !p.isHost)
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, index) => (
                  <View
                    key={p.id}
                    className="flex-row items-center justify-between bg-card-dark border border-neon-cyan/20 p-4 rounded-2xl"
                  >
                    <View className="flex-row items-center gap-3">
                      <Text className="text-neon-cyan font-black text-lg w-8">#{index + 1}</Text>
                      <Text className="text-white font-extrabold text-base">{p.name}</Text>
                    </View>
                    <Text className="text-neon-pink font-black text-base">{p.score} PTS</Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
