import { HostHeaderBar } from './HostHeaderBar';
import { HostLeaderboardSidebar } from './HostLeaderboardSidebar';
import { HostDiscVisualizer } from './HostDiscVisualizer';
import { HostLyricsDisplay } from './HostLyricsDisplay';
import { HostTimerProgressBar } from './HostTimerProgressBar';
import { HostAudioControls } from './HostAudioControls';
import { SpeedRoundModal } from './SpeedRoundModal';
import type { GameState, Player } from '@spotify-music-quiz/shared/schema/game';

interface HostGameViewProps {
  lobbyId: string;
  gameState: GameState;
  buzzerWinner?: Player | null;
  selectedGameMode: string;
  isSpeedRoundModalOpen: boolean;
  setIsSpeedRoundModalOpen: (open: boolean) => void;
  onSelectGameMode: (mode: string) => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onForceReveal: () => void;
  onNextSong: () => void;
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
  onForceReveal,
  onNextSong,
  handleCopyCode,
  onLeave,
  localTimeLeft,
  maxTimeLimit,
}: HostGameViewProps) {
  const currentSong = gameState.currentSong;
  const isRevealed = gameState.isRevealed;
  const isLastSong = (gameState.currentSongIndex ?? 0) >= gameState.songs.length - 1;

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-40" />

      <HostHeaderBar
        quizTitle={gameState.quizTitle}
        lobbyId={lobbyId}
        currentSongIndex={gameState.currentSongIndex ?? 0}
        totalSongs={gameState.songs.length}
        handleCopyCode={handleCopyCode}
        onOpenSpeedModal={() => setIsSpeedRoundModalOpen(true)}
        onLeave={onLeave}
      />

      <main className="w-full max-w-6xl mx-auto px-6 py-8 z-10 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left: Leaderboard Sidebar */}
        <HostLeaderboardSidebar players={gameState.players} buzzerWinner={buzzerWinner} />

        {/* Right: Main Game Screen */}
        <div className="flex-1 bg-black/60 border border-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between">
          <HostDiscVisualizer
            coverArtUrl={currentSong?.track.coverArtUrl}
            songTitle={currentSong?.track.title}
            artistName={currentSong?.track.artist}
            albumName={currentSong?.track.album}
            isPlaying={isPlaying}
            revealed={isRevealed}
          />

          {currentSong?.questionType === 'FILL_IN_THE_GAP' && (
            <HostLyricsDisplay lyrics={currentSong.lyricsGap} revealed={isRevealed} />
          )}

          <HostTimerProgressBar localTimeLeft={localTimeLeft} maxTimeLimit={maxTimeLimit} />

          <HostAudioControls
            isPlaying={isPlaying}
            onTogglePlayPause={onTogglePlayPause}
            onForceReveal={onForceReveal}
            onNextSong={onNextSong}
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
