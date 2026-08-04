import type { Player } from '@spotify-music-quiz/shared/schema/game';
import { Crown, LogOut, Trophy } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface PlayerHeaderBarProps {
  username: string;
  players: Player[];
  onLeave: () => void;
}

export function PlayerHeaderBar({ username, players, onLeave }: PlayerHeaderBarProps) {
  const localPlayer = players.find((p) => p.name.toLowerCase() === username.trim().toLowerCase());
  const contestants = players.filter((p) => !p.isHost);
  const sortedPlayers = [...contestants].sort((a, b) => b.score - a.score);
  const rankIndex = sortedPlayers.findIndex((p) => p.name.toLowerCase() === username.trim().toLowerCase());
  const rank = rankIndex !== -1 ? rankIndex + 1 : null;

  const avatarInitials = username.slice(0, 2).toUpperCase();

  return (
    <View className="w-full bg-card-dark border border-neon-cyan/20 rounded-2xl px-4 py-2.5 flex-row items-center justify-between shadow-lg">
      <View className="flex-row items-center gap-3">
        {/* Avatar badge */}
        <View className="w-9 h-9 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 items-center justify-center">
          <Text className="text-neon-cyan text-xs font-black">{avatarInitials}</Text>
        </View>

        <View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-white text-sm font-black">{username}</Text>
            {localPlayer?.isHost && <Crown size={14} color="#f59e0b" />}
          </View>

          {rank !== null && (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Trophy size={11} color="#f59e0b" />
              <Text className="text-slate-400 text-[10px] font-bold">
                Rank #{rank} of {contestants.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        {/* Score Badge */}
        <View className="bg-neon-cyan/15 border border-neon-cyan/30 px-3 py-1 rounded-full">
          <Text className="text-neon-cyan font-black text-xs">
            {localPlayer?.score ?? 0} PTS
          </Text>
        </View>

        {/* Leave Button */}
        <TouchableOpacity
          className="p-2 bg-red-500/12 rounded-xl"
          onPress={onLeave}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#f87171" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
