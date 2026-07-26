import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useLobbyController } from '#/features/lobby/hooks/useLobbyController';
import { HostLobbyView } from '#/features/lobby/components/HostLobbyView';
import { PlayerWaitingRoomView } from '#/features/lobby/components/PlayerWaitingRoomView';
import { HostGameView } from '#/features/lobby/components/HostGameView';
import { PlayerBuzzerScreen } from '#/features/game-player/components/PlayerBuzzerScreen';
import { GameOverSummary } from '#/features/game-player/components/GameOverSummary';
import { Loader2 } from 'lucide-react';

const lobbySearchSchema = z.object({
  username: z.string(),
});

export const Route = createFileRoute('/lobby/$lobbyId')({
  validateSearch: lobbySearchSchema,
  component: LobbyRoomWrapper,
});

function LobbyRoomWrapper() {
  const { lobbyId } = Route.useParams();
  const { username } = Route.useSearch();
  const lobby = useLobbyController(lobbyId, username);


  if (!lobby.gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] text-cyan-400 font-bold gap-2">
        <Loader2 className="animate-spin" size={24} />
        Connecting to lobby {lobbyId.toUpperCase().slice(0, 3)}-{lobbyId.toUpperCase().slice(3)}
      </div>
    );
  }

  if (lobby.gameState.phase === 'COMPLETED') {
    return (
      <GameOverSummary
        players={lobby.gameState.players}
        isHost={lobby.isHost}
        onRestart={lobby.restartGame}
        onLeave={lobby.handleLeave}
      />
    );
  }

  if (lobby.gameState.phase === 'LOBBY') {
    if (lobby.isHost) {
      return (
        <HostLobbyView
          lobbyId={lobbyId}
          players={lobby.gameState.players}
          songsCount={lobby.gameState.totalSongs}
          selectedMode={lobby.selectedGameMode}
          onSelectMode={lobby.setSelectedGameMode}
          onStartGame={lobby.startGame}
          onLeave={lobby.handleLeave}
          isCopied={lobby.isCopied}
          handleCopyCode={lobby.handleCopyCode}
        />
      );
    }

    return (
      <PlayerWaitingRoomView
        lobbyId={lobbyId}
        username={username}
        players={lobby.gameState.players}
        onLeave={lobby.handleLeave}
      />
    );
  }

  if (lobby.isHost) {
    return (
      <HostGameView
        lobbyId={lobbyId}
        gameState={lobby.gameState}
        selectedGameMode={lobby.selectedGameMode}
        isSpeedRoundModalOpen={lobby.isSpeedRoundModalOpen}
        setIsSpeedRoundModalOpen={lobby.setIsSpeedRoundModalOpen}
        onSelectGameMode={lobby.setSelectedGameMode}
        isPlaying={lobby.audio.isPlaying}
        onTogglePlayPause={lobby.audio.handleTogglePlayPause}
        onRestartTimer={lobby.audio.restartSongAndTimer}
        onForceReveal={lobby.forceRevealAnswer}
        onNextSong={lobby.nextSong}
        onSeek={lobby.audio.seekTrack}
        currentPositionMs={lobby.audio.currentPositionMs}
        durationMs={lobby.audio.durationMs}
        isCopied={lobby.isCopied}
        handleCopyCode={lobby.handleCopyCode}
        onLeave={lobby.handleLeave}
        localTimeLeft={lobby.timer.localTimeLeft}
        maxTimeLimit={lobby.timer.maxTimeLimit}
      />
    );
  }

  return (
    <PlayerBuzzerScreen
      username={username}
      gameState={lobby.gameState}
      guessInput={lobby.guessInput}
      setGuessInput={lobby.setGuessInput}
      gapInputs={lobby.gapInputs}
      setGapInputs={lobby.setGapInputs}
      localTimeLeft={lobby.timer.localTimeLeft}
      maxTimeLimit={lobby.timer.maxTimeLimit}
      onBuzzerClick={() => { }}
      onGuessSubmit={lobby.handleGuessSubmit}
      onGapSubmit={lobby.handleGapSubmit}
      onLeave={lobby.handleLeave}
    />
  );
}
