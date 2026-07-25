import { Crown, Trophy } from 'lucide-react';
import { Badge } from '#/features/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar';
import type { Player } from '@spotify-music-quiz/shared/schema/game';

interface PlayerHeaderBarProps {
  username: string;
  players: Player[];
  isHost?: boolean;
}

export function PlayerHeaderBar({ username, players }: PlayerHeaderBarProps) {
  const localPlayer = players.find((p) => p.name === username);
  const contestants = players.filter((p) => !p.isHost);
  const sortedPlayers = [...contestants].sort((a, b) => b.score - a.score);
  const rankIndex = sortedPlayers.findIndex((p) => p.name === username);
  const rank = rankIndex !== -1 ? rankIndex + 1 : null;

  return (
    <div className="z-20 bg-black/50 border border-cyan-500/20 backdrop-blur-xl rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 border border-cyan-500/30">
          <AvatarFallback className="text-[10px] font-black text-[#00f0ff] bg-cyan-500/20">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-black text-white">{username}</span>
            {localPlayer?.isHost && <Crown size={12} className="text-amber-400 fill-amber-400" />}
          </div>
          {rank && (
            <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
              <Trophy size={10} className="text-amber-400" /> Rank #{rank} of {contestants.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="default" className="font-black text-xs px-3 py-1 bg-cyan-500/10 text-[#00f0ff] border-cyan-500/30">
          {localPlayer?.score ?? 0} PTS
        </Badge>
      </div>
    </div>
  );
}
