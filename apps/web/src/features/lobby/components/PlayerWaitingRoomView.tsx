import { useState } from 'react';
import { Users, Copy, Check, Crown } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { Card } from '#/features/shared/components/ui/card';
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
      <div className="relative w-full min-h-[100dvh] pt-6 sm:py-12 pb-12 flex flex-col justify-start sm:justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
        <div className="synth-grid absolute inset-0 pointer-events-none" />

        <Card className="w-full max-w-2xl p-5 sm:p-8 z-10 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-500/10 mb-6 sm:mb-8">
            <div>
              <span className="text-pink-400 font-bold uppercase tracking-wider text-xs block mb-1">
                Player Lobby &bull; {username}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {quizTitle || 'Waiting Room'}
              </h1>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 bg-black/40 border border-cyan-500/20 px-4 py-2 rounded-2xl shrink-0">
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">
                Lobby ID:
              </span>
              <span className="font-black text-lg sm:text-xl text-[#00f0ff] tracking-widest font-mono">{lobbyId}</span>
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
          <div className="mb-6 sm:mb-8">
            <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-pink-400">
              <Users size={16} /> Players Joined ({players.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl bg-black/40 border border-cyan-500/10 hover:border-cyan-400 transition-colors ${
                    p.isDisconnected ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.isDisconnected ? 'bg-amber-400 animate-pulse' : 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]'}`} />
                    <span className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                      <span className="truncate">{p.name}</span>
                      {p.isHost && <Crown size={14} className="text-amber-500 fill-amber-500 shrink-0" />}
                    </span>
                  </div>
                  <Badge variant={p.isHost ? 'default' : p.isDisconnected ? 'outline' : 'magenta'} className="shrink-0">
                    {p.isDisconnected ? 'Reconnecting...' : p.isHost ? 'Host' : 'Player'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Status Actions */}
          <div className="pt-5 border-t border-cyan-500/10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2.5 bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-2.5 rounded-xl text-xs text-cyan-300 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="leading-snug">
                Waiting for <strong className="text-white font-bold">{hostPlayer?.name || 'Host'}</strong> to start the game...
              </span>
            </div>

            <Button variant="outline" size="sm" onClick={onLeave} className="w-full sm:w-auto border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10 text-rose-300">
              Exit Lobby
            </Button>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
