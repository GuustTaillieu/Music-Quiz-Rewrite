import { Trophy, Crown } from 'lucide-react';
import { Badge } from '#/features/shared/components/ui/badge';
import type { Player } from '@spotify-music-quiz/shared/schema/game';

interface HostLeaderboardSidebarProps {
  players: Player[];
  buzzerWinner?: Player | null;
}

export function HostLeaderboardSidebar({ players }: HostLeaderboardSidebarProps) {
  const contestants = players.filter((p) => !p.isHost);
  const sortedPlayers = [...contestants].sort((a, b) => b.score - a.score);

  return (
    <aside className="w-full lg:w-72 bg-black/60 border border-cyan-500/10 backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between shrink-0">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/10 mb-4">
          <h3 className="font-black text-xs uppercase tracking-wider text-pink-400 flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" /> Leaderboard
          </h3>
          <span className="text-[10px] text-muted-foreground font-bold">
            {contestants.length} contestants
          </span>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {sortedPlayers.map((player, index) => {
            const isFirst = index === 0 && player.score > 0;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isFirst
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-black/30 border-cyan-500/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
                    #{index + 1}
                  </span>
                  <span className="font-bold text-white text-xs truncate flex items-center gap-1">
                    <span className="truncate">{player.name}</span>
                    {isFirst && <Crown size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                  </span>
                </div>

                <Badge variant={isFirst ? 'default' : 'magenta'} className="font-mono font-bold shrink-0">
                  {player.score} PTS
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
