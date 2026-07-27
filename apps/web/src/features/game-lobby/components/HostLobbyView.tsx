import { useState } from 'react';
import { Users, Copy, Check, Crown, Play } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { Card } from '#/features/shared/components/ui/card';
import { GameModeToggleSwitch } from './GameModeToggleSwitch';
import type { GameMode, Player } from '@spotify-music-quiz/shared/schema/game';

interface HostLobbyViewProps {
  lobbyId: string;
  quizTitle?: string;
  players: Player[];
  songsCount: number;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onLeave: () => void;
  isCopied?: boolean;
  handleCopyCode?: () => void;
}

export function HostLobbyView({
  lobbyId,
  quizTitle,
  players,
  songsCount,
  selectedMode,
  onSelectMode,
  onStartGame,
  onLeave,
  isCopied: propIsCopied,
  handleCopyCode: propHandleCopyCode,
}: HostLobbyViewProps) {
  const [localIsCopied, setLocalIsCopied] = useState(false);
  const canStart = songsCount > 0 && players.length >= 3;

  const isCopied = propIsCopied ?? localIsCopied;
  const onCopy = propHandleCopyCode ?? (() => {
    navigator.clipboard.writeText(lobbyId);
    setLocalIsCopied(true);
    setTimeout(() => setLocalIsCopied(false), 2000);
  });

  const formattedLobbyId = lobbyId.length === 6 ? `${lobbyId.slice(0, 3)}-${lobbyId.slice(3)}` : lobbyId;

  return (
    <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none" />

      <Card className="w-full max-w-2xl p-8 z-10 text-left">
        <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-cyan-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-3xl font-black text-white">
              {quizTitle || 'Waiting Room'}
            </h1>

            <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/20 px-4 py-2.5 rounded-2xl shadow-inner">
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">
                Lobby Code:
              </span>
              <span className="font-black text-xl text-[#00f0ff] tracking-widest font-mono">{formattedLobbyId}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCopy}
                className="p-1.5 text-cyan-400 hover:text-[#00f0ff] cursor-pointer flex items-center gap-1"
              >
                {isCopied ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} />
                )}
              </Button>
            </div>
          </div>
          <GameModeToggleSwitch
            selectedMode={selectedMode}
            onSelectMode={onSelectMode}
          />
        </div>

        {/* Players List Grid */}
        <div className="mb-8">
          <h3 className="font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-pink-400">
            <Users size={16} /> Players Joined ({players.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-cyan-500/10 hover:border-cyan-400 transition-colors ${p.isDisconnected ? 'opacity-50' : ''
                  }`}
              >
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  {p.name}
                  {p.isHost && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                </span>
                <Badge variant={p.isHost ? 'default' : p.isDisconnected ? 'outline' : 'magenta'}>
                  {p.isDisconnected ? 'Reconnecting...' : p.isHost ? 'Host' : 'Player'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Start Actions */}
        <div className="pt-4 border-t border-cyan-500/10 flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            Ready when players have joined.
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onLeave}>
              Exit
            </Button>
            <Button variant="default" size="sm" onClick={onStartGame} disabled={!canStart}>
              <Play size={14} fill="currentColor" /> Start Game
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
