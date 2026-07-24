import { useState } from 'react';
import { Users, Copy, Check, Crown } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { Card } from '#/features/shared/components/ui/card';
import { Avatar, AvatarFallback } from '#/features/shared/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/features/shared/components/ui/tooltip';
import type { Player } from '@spotify-music-quiz/shared/schema/game';

interface PlayerWaitingRoomViewProps {
  lobbyId: string;
  username: string;
  quizTitle?: string;
  players: Player[];
  onLeave: () => void;
}

export function PlayerWaitingRoomView({
  lobbyId,
  username,
  quizTitle,
  players,
  onLeave,
}: PlayerWaitingRoomViewProps) {
  const [isCopied, setIsCopied] = useState(false);
  const hostPlayer = players.find((p) => p.isHost);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
        <div className="synth-grid absolute inset-0 pointer-events-none" />

        <Card className="w-full max-w-2xl p-8 z-10 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-cyan-500/10 mb-8">
            <div>
              <span className="text-pink-400 font-bold uppercase tracking-wider text-xs block mb-1">
                Player Lobby &bull; {username}
              </span>
              <h1 className="text-3xl font-black text-white">
                {quizTitle || 'Waiting Room'}
              </h1>
            </div>

            <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/20 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">
                Lobby ID:
              </span>
              <span className="font-black text-xl text-[#00f0ff] tracking-widest">{lobbyId}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 text-cyan-400 hover:text-[#00f0ff] rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isCopied ? 'Copied!' : 'Copy Lobby Code'}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Players List Grid */}
          <div className="mb-8">
            <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-pink-400">
              <Users size={16} /> Players Joined ({players.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-cyan-500/10 hover:border-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 border-cyan-500/30">
                      <AvatarFallback className="text-[9px] font-black text-cyan-400 bg-cyan-500/20">
                        {p.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      {p.name}
                      {p.isHost && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                    </span>
                  </div>
                  <Badge variant={p.isHost ? 'default' : 'magenta'}>
                    {p.isHost ? 'Host' : 'Player'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

        {/* Status Actions */}
        <div className="pt-4 border-t border-cyan-500/10 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            Waiting for <strong className="text-white">{hostPlayer?.name || 'Host'}</strong> to start the game...
          </div>

          <Button variant="outline" size="sm" onClick={onLeave}>
            Exit Lobby
          </Button>
        </div>
      </Card>
    </div>
  </TooltipProvider>
  );
}
