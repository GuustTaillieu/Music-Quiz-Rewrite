import { Loader2, Trophy } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Card } from '#/features/shared/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { useQuizGame } from '../../game-session/hooks/useQuizGame';

export function GameOverSummary() {
  const navigate = useNavigate();
  const { gameState, leaveLobby } = useQuizGame();

  if (!gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] text-cyan-400 font-bold gap-2">
        <Loader2 className="animate-spin" size={24} />
        Loading...
      </div>
    );
  }

  const contestants = gameState.players.filter((p) => !p.isHost);
  const sortedPlayers = [...contestants].sort((a, b) => b.score - a.score);

  return (
    <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none" />

      <Card className="w-full max-w-xl p-8 text-center z-10">
        <Trophy size={50} className="mx-auto text-amber-400 mb-4 animate-bounce" />

        <h1 className="text-3xl font-black text-white mb-1">
          Game Completed!
        </h1>
        <p className="text-muted-foreground text-xs mb-8">
          Here are the final player scores & standings:
        </p>

        <div className="space-y-3 mb-8 text-left max-h-72 overflow-y-auto pr-1">
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-4 rounded-xl border ${idx === 0
                ? 'border-amber-500/40 bg-amber-500/10 font-black text-amber-300'
                : 'border-cyan-500/10 bg-black/30 text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black w-6 text-cyan-400">#{idx + 1}</span>
                <span className="text-xs font-bold">{p.name}</span>
              </div>
              <span className="text-xs font-bold font-mono text-[#00f0ff]">{p.score} pts</span>
            </div>
          ))}

          {sortedPlayers.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              No player scores available.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="default" size="lg" className="flex-1" onClick={() => leaveLobby(() => navigate({ to: '/', replace: true }))}>
            Return to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
