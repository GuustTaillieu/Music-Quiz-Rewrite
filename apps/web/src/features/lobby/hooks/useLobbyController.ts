import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuizGame } from '#/features/game-player/hooks/useQuizGame';
import { authClient } from '#/features/auth/api/auth-client';
import { useLobbyAudio } from './useLobbyAudio';
import { useLobbyTimer } from './useLobbyTimer';
import { parseGapBlocks } from '../utils/lobbyUtils';

export function useLobbyController(lobbyId: string, username: string) {
  const navigate = useNavigate();
  const { data: sessionData } = authClient.useSession();
  const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001';

  const {
    isConnected,
    gameState,
    error,
    lastGuessResult,
    joinLobby,
    startGame,
    startAudioTimer,
    submitGuess,
    passTurn,
    nextSong,
    configureLobby,
    forceReveal,
    endGame,
  } = useQuizGame(wsUrl);

  const isHost = gameState
    ? Boolean(
        (sessionData?.user.id && sessionData.user.id === gameState.hostId) ||
          gameState.players.find((p) => p.name.toLowerCase() === username.trim().toLowerCase())?.isHost
      )
    : false;

  const [selectedGameMode, setSelectedGameMode] = useState<'SPEED_MODE' | 'TURN_BASED'>('TURN_BASED');
  const [guessInput, setGuessInput] = useState('');
  const [gapInputs, setGapInputs] = useState<Record<number, string>>({});
  const [isSpeedRoundModalOpen, setIsSpeedRoundModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Sync Audio Playback
  const audio = useLobbyAudio(gameState, isHost, startAudioTimer);

  // Sync Timer
  const timer = useLobbyTimer(gameState, forceReveal, isHost);

  // Auto join lobby on mount / connect
  useEffect(() => {
    if (isConnected) {
      joinLobby(lobbyId, username, sessionData?.user.id);
    }
  }, [isConnected, lobbyId, username, joinLobby, sessionData?.user.id]);

  // Sync game mode when host changes it
  useEffect(() => {
    if (gameState?.gameMode) {
      setSelectedGameMode(gameState.gameMode);
    }
  }, [gameState?.gameMode]);

  // Reset local guess inputs when active song changes
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
    navigate({ to: '/' });
  };

  const handleGuessSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guessInput.trim()) return;
    submitGuess(guessInput.trim());
    setGuessInput('');
  };

  const handleGapSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeSong = gameState?.activeSong;
    const gapBlocks = parseGapBlocks(activeSong?.lyricsGap);
    const answers = gapBlocks.map((block) => (gapInputs[block.id] || '').trim());
    submitGuess(answers.join(' '));
  };

  const handleSelectGameMode = (mode: 'SPEED_MODE' | 'TURN_BASED') => {
    setSelectedGameMode(mode);
    configureLobby(mode, gameState?.guessingTimeLimit ?? 30);
  };

  return {
    navigate,
    sessionData,
    isConnected,
    gameState,
    error,
    lastGuessResult,
    isHost,
    isCopied,
    selectedGameMode,
    setSelectedGameMode: handleSelectGameMode,
    guessInput,
    setGuessInput,
    gapInputs,
    setGapInputs,
    isSpeedRoundModalOpen,
    setIsSpeedRoundModalOpen,
    audio,
    timer,
    handleCopyCode,
    handleLeave,
    handleGuessSubmit,
    handleGapSubmit,
    forceRevealAnswer: forceReveal,
    nextSong,
    startGame,
    restartGame: startGame,
    passTurn,
  };
}
