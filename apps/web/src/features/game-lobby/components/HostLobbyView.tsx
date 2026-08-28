import { Users, Copy, Check, Crown, Play, QrCode } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { Card } from '#/features/shared/components/ui/card';
import { GameModeToggleSwitch } from './GameModeToggleSwitch';
import { useQuizGame } from '#/features/game-player';
import { useCopyLobbyCode } from '#/features/lobby-core/hooks/useCopyLobyCode';
import { useNavigate } from '@tanstack/react-router';
import { QRCodeSVG } from 'qrcode.react';

export function HostLobbyView() {
  const navigate = useNavigate();
  const { gameState, selectGameMode, startGame, leaveLobby } = useQuizGame();
  const { formattedLobbyId, handleCopyCode, isCopied } = useCopyLobbyCode();

  if (!gameState) return null;
  const guestPlayers = gameState.players.filter((p) => !p.isHost);
  const canStart = gameState.totalSongs > 0 && guestPlayers.length >= 2;

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join?lobbyId=${gameState.lobbyId}`
      : `/join?lobbyId=${gameState.lobbyId}`;

  return (
    <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-6 bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none" />

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Lobby Card */}
        <Card className="lg:col-span-2 p-8 text-left bg-black/60 border border-cyan-500/20 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col gap-6 mb-6 pb-6 border-b border-cyan-500/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white mb-1">
                  Waiting Room
                </h1>
                <p className="text-xs text-muted-foreground">
                  Host lobby is live. Players can join using the code or QR scanner.
                </p>
              </div>
            </div>

            <GameModeToggleSwitch
              selectedMode={gameState.gameMode}
              onSelectMode={selectGameMode}
            />
          </div>

          {/* Players List Grid */}
          <div className="mb-8">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-pink-400">
              <Users size={16} /> Contestants Joined ({guestPlayers.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-cyan-500/10 hover:border-cyan-400 transition-colors ${p.isDisconnected ? 'opacity-50' : ''
                    }`}
                >
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    {p.isHost && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                    {p.name}
                  </span>
                  {p.isDisconnected && (
                    <Badge variant='outline'>
                      Reconnecting...
                    </Badge>
                  )}
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
              <Button variant="outline" size="sm" onClick={() => leaveLobby(() => navigate({ to: '/', replace: true }))}>
                Exit
              </Button>
              <Button variant="default" size="sm" onClick={startGame} disabled={!canStart}>
                <Play size={14} fill="currentColor" /> Start Game
              </Button>
            </div>
          </div>
        </Card>

        {/* Dedicated QR Code Panel */}
        <Card className="lg:col-span-1 p-6 bg-black/60 border border-cyan-500/20 backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 mb-3 border border-cyan-500/20">
            <QrCode size={24} />
          </div>

          <h3 className="text-lg font-bold text-white mb-1">Scan to Join</h3>
          <p className="text-[11px] text-muted-foreground mb-6 max-w-xs leading-relaxed">
            Point smartphone camera at the QR code to open the game in your mobile browser automatically.
          </p>

          <div className="p-4 bg-[#05070f] border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_25px_rgba(0,240,255,0.2)] mb-4">
            <QRCodeSVG
              value={joinUrl}
              size={150}
              bgColor="#05070f"
              fgColor="#00f0ff"
              level="H"
            />
          </div>

          <Button variant='outline' size='sm' onClick={handleCopyCode} className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Code: {formattedLobbyId}
            {isCopied ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} />
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
}
