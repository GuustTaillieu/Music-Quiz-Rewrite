import { Users, Crown } from 'lucide-react';
import type { Player } from '@spotify-music-quiz/shared/schema/game';

interface HostLeaderboardSidebarProps {
  players: Player[];
  buzzerWinner?: Player | null;
}

export function HostLeaderboardSidebar({ players, buzzerWinner }: HostLeaderboardSidebarProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full lg:w-72 bg-black/50 border border-cyan-500/10 backdrop-blur-xl rounded-2xl p-4 flex flex-col shrink-0">
      <div className="flex items-center gap-2 pb-3 border-b border-cyan-500/10 mb-3 text-cyan-400 font-black text-xs uppercase tracking-wider">
        <Users size={14} /> Live Leaderboard ({players.length})
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
        {sortedPlayers.map((player, idx) => {
          const isWinner = buzzerWinner?.username === player.username;

          return (
            <div
              key={player.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                isWinner
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                  : idx === 0
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-white'
                  : 'bg-black/30 border-cyan-500/10 text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[10px] font-mono font-bold w-4 text-center text-cyan-500">
                  #{idx + 1}
                </span>
                {idx === 0 && <Crown size={12} className="text-amber-400 shrink-0" />}
                <span className="font-bold text-xs truncate">{player.username}</span>
              </div>
              <span className="font-mono font-black text-xs text-[#00f0ff]">{player.score} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
