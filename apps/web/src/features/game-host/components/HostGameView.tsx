import { SpeedRoundModal } from '#/features/game-lobby';
import { HostHeaderBar } from './HostHeaderBar';
import { HostLeaderboardSidebar } from './HostLeaderboardSidebar';
import { HostDiscVisualizer } from './HostDiscVisualizer';
import { HostLyricsDisplay } from './HostLyricsDisplay';
import { HostTimerProgressBar } from './HostTimerProgressBar';
import { HostAudioControls } from './HostAudioControls';
import type { GameSessionState, Player } from '@spotify-music-quiz/shared/schema/game';

interface HostGameViewProps {
  lobbyId: string;
  gameState: GameSessionState;
  buzzerWinner?: Player | null;
  selectedGameMode: 'SPEED_MODE' | 'TURN_BASED';
  isSpeedRoundModalOpen: boolean;
  setIsSpeedRoundModalOpen: (open: boolean) => void;
  onSelectGameMode: (mode: 'SPEED_MODE' | 'TURN_BASED') => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onRestartTimer: () => void;
  onForceReveal: () => void;
  onNextSong: () => void;
  onSeek?: (positionMs: number) => void;
  currentPositionMs?: number;
  durationMs?: number;
  isCopied?: boolean;
  handleCopyCode: () => void;
  onLeave: () => void;
  localTimeLeft: number | null;
  maxTimeLimit: number;
}

export function HostGameView({
  lobbyId,
  gameState,
  buzzerWinner,
  selectedGameMode,
  isSpeedRoundModalOpen,
  setIsSpeedRoundModalOpen,
  onSelectGameMode,
  isPlaying,
  onTogglePlayPause,
  onRestartTimer,
  onForceReveal,
  onNextSong,
  onSeek,
  currentPositionMs,
  durationMs,
  isCopied,
  handleCopyCode,
  onLeave,
  localTimeLeft,
  maxTimeLimit,
}: HostGameViewProps) {
  const activeSong = gameState.activeSong;
  const isRevealed = gameState.roundState === 'REVEALED';
  const isLastSong = (gameState.currentSongIndex ?? 0) >= gameState.totalSongs - 1;

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-40" />

      <HostHeaderBar
        lobbyId={lobbyId}
        currentSongIndex={gameState.currentSongIndex ?? 0}
        totalSongs={gameState.totalSongs}
        selectedMode={selectedGameMode}
        onSelectMode={onSelectGameMode}
        isCopied={isCopied}
        handleCopyCode={handleCopyCode}
        onLeave={onLeave}
      />

      <main className="w-full max-w-6xl mx-auto px-6 py-8 z-10 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left: Leaderboard Sidebar */}
        <HostLeaderboardSidebar players={gameState.players} buzzerWinner={buzzerWinner} />

        {/* Right: Main Game Screen */}
        <div className="flex-1 bg-black/60 border border-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between">
          <HostDiscVisualizer
            coverArtUrl={activeSong?.coverArtUrl}
            songTitle={activeSong?.title}
            artistName={activeSong?.artist}
            albumName={activeSong?.album}
            isPlaying={isPlaying}
            revealed={isRevealed}
          />

          {activeSong?.questionType === 'FILL_IN_THE_GAP' && (
            <HostLyricsDisplay lyrics={activeSong.lyricsGap ?? undefined} revealed={isRevealed} />
          )}

          <HostTimerProgressBar localTimeLeft={localTimeLeft} maxTimeLimit={maxTimeLimit} />

          <HostAudioControls
            isPlaying={isPlaying}
            onTogglePlayPause={onTogglePlayPause}
            onRestartTimer={onRestartTimer}
            onForceReveal={onForceReveal}
            onNextSong={onNextSong}
            onSeek={onSeek}
            currentPositionMs={currentPositionMs}
            durationMs={durationMs}
            revealed={isRevealed}
            isLastSong={isLastSong}
          />
        </div>
      </main>

      <SpeedRoundModal
        isOpen={isSpeedRoundModalOpen}
        onClose={() => setIsSpeedRoundModalOpen(false)}
        selectedMode={selectedGameMode}
        onSelectMode={onSelectGameMode}
      />
    </div>
  );
}
