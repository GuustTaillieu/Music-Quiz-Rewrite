import { Trophy, Music, Clock, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '#/features/shared/components/ui/card';
import { Badge } from '#/features/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar';
import type { Player } from '@spotify-music-quiz/shared/schema/game';
import { useQuizGame } from '..';

interface RoundSummaryOverlayProps {
  username: string;
}

export function RoundSummaryOverlay({ username }: RoundSummaryOverlayProps) {
  const { gameState } = useQuizGame();

  if (!gameState) return null;

  const winner = gameState.players.find((p: Player) => p.id === gameState.lastRoundWinnerId);
  const isUserWinner = winner?.name === username;

  const contestants = gameState.players.filter((p: Player) => !p.isHost);
  const sortedPlayers = [...contestants].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-md p-6 bg-[#0b0e17] border border-cyan-500/30 glow-border-cyan shadow-2xl rounded-3xl text-center space-y-5 overflow-hidden relative">
        {/* Glow ambient background accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#00f0ff]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex justify-center">
          <Badge variant="magenta" className="px-4 py-1.5 text-xs font-black uppercase tracking-widest gap-1.5 shadow-lg">
            <Sparkles size={14} /> Round Results
          </Badge>
        </div>

        {/* Song Info Card */}
        {gameState.activeSong && (
          <div className="flex items-center gap-4 p-3.5 bg-black/50 border border-cyan-500/20 rounded-2xl text-left">
            {gameState.activeSong.coverArtUrl ? (
              <img
                src={gameState.activeSong.coverArtUrl}
                alt={gameState.activeSong.title || 'Track'}
                className="h-16 w-16 rounded-xl object-cover border border-cyan-500/20 shadow-md shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Music size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-0.5">
                The song was:
              </span>
              <h4 className="font-extrabold text-white text-sm truncate leading-tight">
                {gameState.activeSong.title || 'Unknown Track'}
              </h4>
              <p className="text-xs font-medium text-muted-foreground truncate leading-tight mt-0.5">
                {gameState.activeSong.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>
        )}

        {/* Winner Highlight Banner */}
        {winner ? (
          <div className={`p-4 rounded-2xl border text-center space-y-1 ${isUserWinner
            ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            : 'bg-cyan-500/10 border-cyan-500/30'
            }`}>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={18} className={isUserWinner ? 'text-emerald-400' : 'text-cyan-400'} />
              <span className="font-black text-sm text-white">
                {isUserWinner ? 'You won this round!' : `${winner.name} got it right!`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              +1 Point added to the leaderboard
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center gap-2 text-rose-400 text-xs font-bold">
            <XCircle size={16} />
            <span>Nobody guessed it this round!</span>
          </div>
        )}

        {/* Updated Round Leaderboard */}
        <div className="space-y-2 text-left">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
            <Trophy size={12} className="text-amber-400" /> Current Leaderboard
          </h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {sortedPlayers.slice(0, 4).map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${player.name === username
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-white'
                  : 'bg-black/40 border border-cyan-500/10 text-muted-foreground'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-cyan-400 w-4 text-center">
                    #{idx + 1}
                  </span>
                  <Avatar className="h-6 w-6 border-cyan-500/30">
                    <AvatarFallback className="text-[9px] font-black text-cyan-400 bg-cyan-500/20">
                      {player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[140px] text-white">{player.name}</span>
                </div>
                <Badge variant={idx === 0 ? 'default' : 'magenta'} className="text-[10px] px-2 py-0.5">
                  {player.score} pts
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Host Status Footer */}
        <div className="pt-2 border-t border-cyan-500/10 flex items-center justify-center gap-2 text-xs text-muted-foreground font-semibold">
          <Clock size={14} className="text-cyan-400 animate-spin" />
          <span>Waiting for host to start next round...</span>
        </div>
      </Card>
    </div>
  );
}
