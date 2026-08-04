import type { ActiveSongInfo, Player } from '@spotify-music-quiz/shared/schema/game';
import { CheckCircle2, Music, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface RoundSummaryCardProps {
  activeSong: ActiveSongInfo | null;
  lastRoundWinner: Player | null;
  username: string;
}

export function RoundSummaryCard({ activeSong, lastRoundWinner, username }: RoundSummaryCardProps) {
  if (!activeSong) return null;

  const isMeWinner = lastRoundWinner && lastRoundWinner.name.toLowerCase() === username.trim().toLowerCase();

  return (
    <View className="w-full bg-card-dark border-1.5 border-neon-cyan/40 rounded-3xl p-5 items-center my-3 shadow-2xl">
      <View className="flex-row items-center gap-1.5 bg-neon-cyan/10 border border-neon-cyan/30 px-3 py-1 rounded-full mb-3">
        <Sparkles size={14} color="#00f0ff" />
        <Text className="text-neon-cyan text-xs font-black tracking-widest">ROUND RESULT</Text>
      </View>

      {/* Album Cover Art */}
      {activeSong.coverArtUrl ? (
        <Image
          source={{ uri: activeSong.coverArtUrl }}
          className="w-32 h-32 rounded-2xl mb-3 border-2 border-neon-cyan/30"
          resizeMode="cover"
        />
      ) : (
        <View className="w-32 h-32 rounded-2xl mb-3 bg-neon-cyan/10 border-2 border-neon-cyan/30 items-center justify-center">
          <Music size={40} color="#00f0ff" />
        </View>
      )}

      {/* Song Details */}
      <Text className="text-white text-lg font-black text-center mb-0.5">{activeSong.title || 'Unknown Title'}</Text>
      <Text className="text-slate-400 text-xs font-semibold text-center mb-3">{activeSong.artist || 'Unknown Artist'}</Text>

      {/* Winner Status Banner */}
      {lastRoundWinner ? (
        <View className={`w-full py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 ${isMeWinner ? 'bg-green-500/20 border border-green-500/40' : 'bg-neon-cyan/15 border border-neon-cyan/30'}`}>
          <CheckCircle2 size={18} color={isMeWinner ? '#4ade80' : '#00f0ff'} />
          <Text className={`font-black text-xs ${isMeWinner ? 'text-green-400' : 'text-neon-cyan'}`}>
            {isMeWinner ? '🎉 YOU GUESSED IT RIGHT! (+1 PT)' : `⚡ ${lastRoundWinner.name} guessed correctly!`}
          </Text>
        </View>
      ) : (
        <View className="w-full py-2.5 px-4 bg-slate-800/50 border border-slate-700 rounded-xl items-center">
          <Text className="text-slate-400 font-bold text-xs">No correct guesses this round!</Text>
        </View>
      )}
    </View>
  );
}
