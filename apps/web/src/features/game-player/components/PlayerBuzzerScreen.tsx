import React from 'react';
import { Clock, XCircle } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import { CavaVisualizer } from '#/features/lobby/components/CavaVisualizer';
import { parseGapBlocks } from '#/features/lobby/utils/lobbyUtils';
import { PlayerHeaderBar } from './PlayerHeaderBar';
import { PlayerLeaveButton } from './PlayerLeaveButton';
import { RoundSummaryOverlay } from './RoundSummaryOverlay';
import { useCountdownVFX } from '../hooks/useCountdownVFX';
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
  maxTimeLimit?: number;
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
  maxTimeLimit = 30,
  onGuessSubmit,
  onGapSubmit,
  onLeave,
}: PlayerBuzzerScreenProps) {
  const activeSong = gameState.activeSong;
  const isPlaying = gameState.phase === 'SPEED_ROUND' || gameState.phase === 'TURN_BASED';
  const isRevealed = gameState.roundState === 'REVEALED';
  const isSpeedMode = gameState.gameMode === 'SPEED_MODE';

  const currentPlayer = gameState.players.find(
    (p) => p.name.toLowerCase() === username.trim().toLowerCase(),
  );
  const currentPlayerId = currentPlayer?.id;

  const hasAlreadyGuessed = currentPlayerId
    ? gameState.playersGuessed.includes(currentPlayerId)
    : false;

  const isMyTurn = isSpeedMode
    ? true
    : currentPlayerId
    ? gameState.activePlayerId === currentPlayerId
    : false;

  const activeTurnPlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);

  // Custom countdown visual effects hook
  const { hasTimer, isTimeUp, isCritical, secondsLeft } = useCountdownVFX(localTimeLeft);
  const isDisabled = !isPlaying || isRevealed || isTimeUp;

  const gapBlocks = parseGapBlocks(activeSong?.lyricsGap);
  const progressPercent = hasTimer && maxTimeLimit > 0
    ? Math.max(0, Math.min(100, ((secondsLeft ?? 0) / maxTimeLimit) * 100))
    : 100;

  return (
    <div
      className={`relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden px-6 py-6 bg-[#05070f] text-white transition-all duration-300 ${
        isCritical ? 'shadow-[inset_0_0_100px_rgba(244,63,94,0.7)] border-4 border-rose-500/80' : ''
      }`}
    >
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-30" />

      {/* Top Bar: Separated Player Status & Floating Leave Button */}
      <div className="z-20 flex items-center justify-between gap-4 w-full">
        <div className="flex-1 max-w-sm">
          <PlayerHeaderBar username={username} players={gameState.players} />
        </div>
        <PlayerLeaveButton onLeave={onLeave} />
      </div>

      {/* High-Stakes Videogame Countdown Overlay (Last 5 Seconds) */}
      {isCritical && secondsLeft !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none">
          <div className="text-8xl sm:text-9xl font-black text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.9)] pointer-events-none">
            {secondsLeft}
          </div>
        </div>
      )}

      {/* End of Round Summary Overlay */}
      {isRevealed && (
        <RoundSummaryOverlay gameState={gameState} username={username} />
      )}

      {/* Main Visualizer Area */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center min-h-0 py-4 text-center">
        {isPlaying ? (
          <div className="space-y-4">
            <Badge variant={isCritical ? 'destructive' : 'magenta'} className="px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-md">
              {activeSong?.questionType === 'FILL_IN_THE_GAP'
                ? 'Fill in the Gap Lyrics'
                : 'Guess the Track Title'}
            </Badge>

            <CavaVisualizer isPlaying={true} />

            {buzzerWinner && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-bounce">
                <span className="text-xs font-bold text-amber-400">
                  ⚡ {buzzerWinner.name} guessed correctly!
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <Clock size={28} className="mx-auto text-cyan-400 animate-spin" />
            <p className="text-xs text-muted-foreground font-bold">Waiting for host to start...</p>
          </div>
        )}
      </div>

      {/* Integrated Progress Bar & Seconds Readout (Positioned Above Input Footer) */}
      <div className="z-10 w-full max-w-md mx-auto space-y-1.5 mb-2">
        {hasTimer && (
          <div className="flex items-center justify-between text-[11px] font-mono font-black tracking-wider px-1">
            <span className={isCritical ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}>
              {isTimeUp ? "TIME'S UP!" : isCritical ? '⚠️ TIME RUNNING OUT' : 'TIME REMAINING'}
            </span>
            <span className={`text-xs ${isCritical ? 'text-rose-400 font-extrabold animate-bounce' : 'text-[#00f0ff]'}`}>
              {isTimeUp ? '0s' : `${secondsLeft}s`}
            </span>
          </div>
        )}

        {hasTimer && (
          <div className="h-2.5 w-full bg-cyan-500/10 rounded-full overflow-hidden border border-cyan-500/20 shadow-inner">
            <div
              className={`h-full transition-all duration-300 ease-linear ${
                isTimeUp
                  ? 'bg-rose-600 shadow-[0_0_12px_#f43f5e]'
                  : isCritical
                  ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse'
                  : 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Action / Input Footer */}
      <div className="relative z-40 bg-black/60 border border-cyan-500/20 rounded-3xl p-5 backdrop-blur-lg shrink-0 w-full max-w-md mx-auto mb-2 space-y-3 pointer-events-auto">
        {hasAlreadyGuessed && !isRevealed ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-1.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
              <XCircle size={18} /> Incorrect Answer
            </div>
            <p className="text-xs text-rose-200/80 font-medium leading-relaxed">
              Your guess was incorrect. Please wait for the round to end...
            </p>
          </div>
        ) : !isSpeedMode && !isMyTurn && !isRevealed ? (
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Clock size={16} className="animate-spin" /> Waiting for Turn
            </div>
            <p className="text-xs text-cyan-200/80 font-medium">
              It is currently <strong className="text-white">{activeTurnPlayer?.name || 'another player'}</strong>'s turn to guess!
            </p>
          </div>
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
