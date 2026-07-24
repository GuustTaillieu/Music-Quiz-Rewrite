import React from 'react';
import { Crown, LogOut, Clock, Sparkles } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import { CavaVisualizer } from '#/features/lobby/components/CavaVisualizer';
import { parseGapBlocks } from '#/features/lobby/utils/lobbyUtils';
import type { GameSessionState, Player } from '@spotify-music-quiz/shared/schema/game';

interface PlayerBuzzerScreenProps {
  username: string;
  gameState: GameSessionState;
  buzzerWinner?: Player | null;
  guessInput: string;
  setGuessInput: (val: string) => void;
  gapInputs: Record<number, string>;
  setGapInputs: (inputs: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  localTimeLeft?: number | null;
  onBuzzerClick: () => void;
  onGuessSubmit: (e?: React.FormEvent) => void;
  onGapSubmit: (e?: React.FormEvent) => void;
  onLeave: () => void;
}

export function PlayerBuzzerScreen({
  username,
  gameState,
  buzzerWinner,
  guessInput,
  setGuessInput,
  gapInputs,
  setGapInputs,
  localTimeLeft,
  onBuzzerClick,
  onGuessSubmit,
  onGapSubmit,
  onLeave,
}: PlayerBuzzerScreenProps) {
  const activeSong = gameState.activeSong;
  const isPlaying = gameState.phase === 'SPEED_ROUND' || gameState.phase === 'TURN_BASED';
  const isRevealed = gameState.roundState === 'REVEALED';
  const isTimeUp = localTimeLeft === 0;
  const isDisabled = !isPlaying || isRevealed || isTimeUp;
  const localPlayer = gameState.players.find((p: Player) => p.name === username);
  const isBuzzerMode = gameState.gameMode === 'SPEED_MODE';

  const gapBlocks = parseGapBlocks(activeSong?.lyricsGap);

  return (
    <div className="relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden px-6 py-6 bg-[#05070f] text-white select-none">
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-30" />

      {/* Header bar */}
      <div className="z-10 bg-black/40 border border-cyan-500/10 rounded-2xl p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-white">{username}</span>
        </div>

        <div className="flex items-center gap-3">
          {localTimeLeft !== undefined && localTimeLeft !== null && (
            <Badge variant={isTimeUp ? 'magenta' : 'default'} className="font-mono">
              {isTimeUp ? "Time's Up!" : `${localTimeLeft}s`}
            </Badge>
          )}
          <Badge variant="default">{localPlayer?.score ?? 0} pts</Badge>
          <button
            onClick={onLeave}
            className="p-1 text-muted-foreground hover:text-rose-400 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center min-h-0 py-6 text-center">
        {isPlaying ? (
          <div className="space-y-4">
            <Badge variant="magenta">
              {activeSong?.questionType === 'FILL_IN_THE_GAP'
                ? 'Fill in the Gap Lyrics'
                : 'Guess the Track Title'}
            </Badge>

            <CavaVisualizer isPlaying={true} />

            {buzzerWinner && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-bounce">
                <span className="text-xs font-bold text-amber-400">
                  ⚡ {buzzerWinner.name} buzzed in!
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <Clock size={28} className="mx-auto text-cyan-400 animate-spin" />
            <p className="text-xs text-muted-foreground font-bold">Waiting for host...</p>
          </div>
        )}
      </div>

      {/* Action / Input Footer */}
      <div className="z-10 bg-black/60 border border-cyan-500/20 rounded-3xl p-5 backdrop-blur-lg shrink-0 w-full max-w-md mx-auto mb-2 space-y-3">
        {isBuzzerMode && !buzzerWinner ? (
          <Button
            variant="default"
            size="lg"
            onClick={onBuzzerClick}
            disabled={isDisabled}
            className="w-full py-6 text-lg tracking-widest shadow-[0_0_30px_rgba(0,240,255,0.4)]"
          >
            <Sparkles size={20} /> BUZZ IN!
          </Button>
        ) : activeSong?.questionType === 'FILL_IN_THE_GAP' ? (
          <form onSubmit={onGapSubmit} className="space-y-3">
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {gapBlocks.map((block) => (
                <div key={block.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">
                    Gap #{block.id + 1}:
                  </span>
                  <Input
                    type="text"
                    placeholder={isTimeUp ? "Time's up!" : `Word... (${block.wordCount} words)`}
                    value={gapInputs[block.id] || ''}
                    disabled={isDisabled}
                    onChange={(e) =>
                      setGapInputs((prev) => ({ ...prev, [block.id]: e.target.value }))
                    }
                    className="py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>
            <Button type="submit" variant="spotify" size="lg" disabled={isDisabled} className="w-full">
              Submit Lyric Answers
            </Button>
          </form>
        ) : (
          <form onSubmit={onGuessSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder={isTimeUp ? "Time's up!" : "Type your guess here..."}
              value={guessInput}
              disabled={isDisabled}
              onChange={(e) => setGuessInput(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button type="submit" variant="default" disabled={isDisabled}>
              Send
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
