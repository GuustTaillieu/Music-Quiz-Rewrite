import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { HostLobbyView, PlayerWaitingRoomView } from '#/features/game-lobby';
import { HostGameView, useLobbyAudio, useLobbyTimer } from '#/features/game-host';
import { PlayerBuzzerScreen, GameOverSummary, useQuizGame } from '#/features/game-player';
import { useAuth } from '#/features/auth';
import { parseGapBlocks } from '#/features/shared/utils/lobbyUtils';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, type SubmitEventHandler } from 'react';
import { GameMode, GamePhase } from '@spotify-music-quiz/shared/schema/game';

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
  const { user } = useAuth();

  const {
    isConnected,
    gameState,
    joinLobby,
    startGame,
    startAudioTimer,
    submitGuess,
    nextSong,
    configureLobby,
    forceReveal,
    endGame,
  } = useQuizGame();

  const isHost = gameState
    ? Boolean(
      (user?.id && user.id === gameState.hostId) ||
      gameState.players.find((p) => p.name.toLowerCase() === username.trim().toLowerCase())?.isHost
    )
    : false;

  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(GameMode.TURN_BASED);
  const [guessInput, setGuessInput] = useState('');
  const [gapInputs, setGapInputs] = useState<Record<number, string>>({});
  const [isSpeedRoundModalOpen, setIsSpeedRoundModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const audio = useLobbyAudio(gameState, isHost, startAudioTimer);
  const timer = useLobbyTimer(gameState, forceReveal, isHost);

  useEffect(() => {
    if (isConnected) {
      joinLobby(lobbyId, username, user?.id);
    }
  }, [isConnected, lobbyId, username, joinLobby, user?.id]);

  useEffect(() => {
    if (gameState?.gameMode) {
      setSelectedGameMode(gameState.gameMode);
    }
  }, [gameState?.gameMode]);

  useEffect(() => {
    setGuessInput('');
    setGapInputs({});
  }, [gameState?.currentSongIndex]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLeave = () => {
    endGame();
    window.location.href = '/';
  };

  const handleGuessSubmit: SubmitEventHandler = (e) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    submitGuess(guessInput.trim());
    setGuessInput('');
  };

  const handleGapSubmit: SubmitEventHandler = (e) => {
    e.preventDefault();
    const activeSong = gameState?.activeSong;
    const gapBlocks = parseGapBlocks(activeSong?.lyricsGap);
    const answers = gapBlocks.map((block) => (gapInputs[block.id] || '').trim());
    submitGuess(answers.join(' '));
  };

  const handleSelectGameMode = (mode: GameMode) => {
    setSelectedGameMode(mode);
    configureLobby(mode, gameState?.guessingTimeLimit ?? 30);
  };

  if (!gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] text-cyan-400 font-bold gap-2">
        <Loader2 className="animate-spin" size={24} />
        Connecting to lobby {lobbyId.toUpperCase().slice(0, 3)}-{lobbyId.toUpperCase().slice(3)}
      </div>
    );
  }

  if (gameState.phase === GamePhase.COMPLETED) {
    return (
      <GameOverSummary
        players={gameState.players}
        isHost={isHost}
        onRestart={startGame}
        onLeave={handleLeave}
      />
    );
  }

  if (gameState.phase === GamePhase.LOBBY) {
    if (isHost) {
      return (
        <HostLobbyView
          lobbyId={lobbyId}
          players={gameState.players}
          songsCount={gameState.totalSongs}
          selectedMode={selectedGameMode}
          onSelectMode={handleSelectGameMode}
          onStartGame={startGame}
          onLeave={handleLeave}
          isCopied={isCopied}
          handleCopyCode={handleCopyCode}
        />
      );
    }

    return (
      <PlayerWaitingRoomView
        lobbyId={lobbyId}
        username={username}
        players={gameState.players}
        onLeave={handleLeave}
      />
    );
  }

  if (isHost) {
    return (
      <HostGameView
        lobbyId={lobbyId}
        gameState={gameState}
        selectedGameMode={selectedGameMode}
        isSpeedRoundModalOpen={isSpeedRoundModalOpen}
        setIsSpeedRoundModalOpen={setIsSpeedRoundModalOpen}
        onSelectGameMode={handleSelectGameMode}
        isPlaying={audio.isPlaying}
        onTogglePlayPause={audio.handleTogglePlayPause}
        onRestartTimer={audio.restartSongAndTimer}
        onForceReveal={forceReveal}
        onNextSong={nextSong}
        onSeek={audio.seekTrack}
        currentPositionMs={audio.currentPositionMs}
        durationMs={audio.durationMs}
        isCopied={isCopied}
        handleCopyCode={handleCopyCode}
        onLeave={handleLeave}
        localTimeLeft={timer.localTimeLeft}
        maxTimeLimit={timer.maxTimeLimit}
      />
    );
  }

  return (
    <PlayerBuzzerScreen
      username={username}
      gameState={gameState}
      guessInput={guessInput}
      setGuessInput={setGuessInput}
      gapInputs={gapInputs}
      setGapInputs={setGapInputs}
      localTimeLeft={timer.localTimeLeft}
      maxTimeLimit={timer.maxTimeLimit}
      onBuzzerClick={() => { }}
      onGuessSubmit={handleGuessSubmit}
      onGapSubmit={handleGapSubmit}
      onLeave={handleLeave}
    />
  );
}
