import { HostHeaderBar } from './HostHeaderBar';
import { HostLeaderboardSidebar } from './HostLeaderboardSidebar';
import { HostDiscVisualizer } from './HostDiscVisualizer';
import { HostLyricsDisplay } from './HostLyricsDisplay';
import { HostTimerProgressBar } from './HostTimerProgressBar';
import { HostAudioControls } from './HostAudioControls';
import { QuestionType, RoundState, type Player } from '@spotify-music-quiz/shared/schema/game';
import { useQuizGame } from '#/features/game-player';
import { useGameTimer } from '../hooks/useGameTimer';
import { useSpotifyPlayer } from '#/features/audio-player';
import { useNavigate } from '@tanstack/react-router';
import { useGameAudio } from '..';

interface HostGameViewProps {
  buzzerWinner?: Player | null;
}

export function HostGameView({
  buzzerWinner,
}: HostGameViewProps) {
  const navigate = useNavigate();
  const { forceReveal, gameState, nextSong, leaveLobby } = useQuizGame()
  const { isPlaying } = useSpotifyPlayer()
  const { localTimeLeft, maxTimeLimit } = useGameTimer(forceReveal);
  const { restartSongAndTimer } = useGameAudio()

  if (!gameState) return null

  const activeSong = gameState.activeSong;
  const isRevealed = gameState.roundState === RoundState.REVEALED;
  const isLastSong = (gameState.currentSongIndex ?? 0) >= gameState.totalSongs - 1;

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-40" />

      <HostHeaderBar
        currentSongIndex={gameState.currentSongIndex ?? 0}
        totalSongs={gameState.totalSongs}
        onLeave={() => leaveLobby(() => navigate({ to: '/', replace: true }))}
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

          {activeSong?.questionType === QuestionType.FILL_IN_THE_GAP && (
            <HostLyricsDisplay lyrics={activeSong.lyricsGap ?? undefined} revealed={isRevealed} />
          )}

          <HostTimerProgressBar localTimeLeft={localTimeLeft} maxTimeLimit={maxTimeLimit} />

          <HostAudioControls
            onForceReveal={forceReveal}
            onNextSong={nextSong}
            revealed={isRevealed}
            isLastSong={isLastSong}
            onRestartSong={restartSongAndTimer}
          />
        </div>
      </main>
    </div>
  );
}
