import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useLobbyController } from '#/features/lobby/hooks/useLobbyController';
import { HostLobbyView } from '#/features/lobby/components/HostLobbyView';
import { PlayerWaitingRoomView } from '#/features/lobby/components/PlayerWaitingRoomView';
import { HostGameView } from '#/features/lobby/components/HostGameView';
import { PlayerBuzzerScreen } from '#/features/game-player/components/PlayerBuzzerScreen';
import { GameOverSummary } from '#/features/game-player/components/GameOverSummary';

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
      <div className="flex h-screen items-center justify-center bg-[#05070f] text-cyan-400 font-bold">
        Connecting to lobby {lobbyId}...
      </div>
    );
  }

  if (lobby.gameState.status === 'FINISHED') {
    return (
      <GameOverSummary
        players={lobby.gameState.players}
        isHost={lobby.isHost}
        onRestart={lobby.restartGame}
        onLeave={lobby.handleLeave}
      />
    );
  }

  if (lobby.gameState.status === 'WAITING') {
    if (lobby.isHost) {
      return (
        <HostLobbyView
          lobbyId={lobbyId}
          quizTitle={lobby.gameState.quizTitle}
          players={lobby.gameState.players}
          songsCount={lobby.gameState.songs.length}
          selectedMode={lobby.selectedGameMode}
          onSelectMode={lobby.setGameMode}
          onStartGame={() => lobby.startGame(lobby.selectedGameMode)}
          onLeave={lobby.handleLeave}
        />
      );
    }

    return (
      <PlayerWaitingRoomView
        lobbyId={lobbyId}
        username={username}
        quizTitle={lobby.gameState.quizTitle}
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
        buzzerWinner={lobby.buzzerWinner}
        selectedGameMode={lobby.selectedGameMode}
        isSpeedRoundModalOpen={lobby.isSpeedRoundModalOpen}
        setIsSpeedRoundModalOpen={lobby.setIsSpeedRoundModalOpen}
        onSelectGameMode={lobby.setGameMode}
        isPlaying={lobby.audio.isPlaying}
        onTogglePlayPause={lobby.audio.handleTogglePlayPause}
        onForceReveal={lobby.forceRevealAnswer}
        onNextSong={lobby.nextSong}
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
      isBuzzerWinner={lobby.isBuzzerWinner}
      buzzerWinner={lobby.buzzerWinner}
      guessInput={lobby.guessInput}
      setGuessInput={lobby.setGuessInput}
      gapInputs={lobby.gapInputs}
      setGapInputs={lobby.setGapInputs}
      onBuzzerClick={lobby.handleBuzzerClick}
      onGuessSubmit={lobby.handleGuessSubmit}
      onGapSubmit={lobby.handleGapSubmit}
      onLeave={lobby.handleLeave}
    />
  );
}
