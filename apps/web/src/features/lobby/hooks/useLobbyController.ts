import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuizGame } from '#/features/game-player/hooks/useQuizGame';
import { authClient } from '#/features/auth/api/auth-client';
import { useLobbyAudio } from './useLobbyAudio';
import { useLobbyTimer } from './useLobbyTimer';
import { LOBBY_CONSTANTS } from '../constants/lobbyConstants';
import { parseGapBlocks } from '../utils/lobbyUtils';

export function useLobbyController(lobbyId: string, username: string) {
  const navigate = useNavigate();
  const { data: sessionData } = authClient.useSession();
  const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001';

  const {
    isConnected,
    gameState,
    error,
    buzzerWinner,
    buzz,
    submitGuess,
    submitGapAnswers,
    forceRevealAnswer,
    nextSong,
    startGame,
    restartGame,
    setGameMode,
    joinLobby,
    leaveLobby,
  } = useQuizGame(wsUrl);

  const isHost = sessionData?.user.id === gameState.hostId;
  const isBuzzerWinner = buzzerWinner?.username === username;

  const [selectedGameMode, setSelectedGameMode] = useState<string>(LOBBY_CONSTANTS.DEFAULT_GAME_MODE);
  const [guessInput, setGuessInput] = useState('');
  const [gapInputs, setGapInputs] = useState<Record<number, string>>({});
  const [isSpeedRoundModalOpen, setIsSpeedRoundModalOpen] = useState(false);

  // Sync Audio Playback
  const audio = useLobbyAudio(gameState, isHost);

  // Sync Timer
  const timer = useLobbyTimer(gameState, forceRevealAnswer);

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

  // Reset local guess inputs when current song changes
  useEffect(() => {
    setGuessInput('');
    setGapInputs({});
  }, [gameState?.currentSongIndex]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyId);
    alert('Lobby Code copied to clipboard!');
  };

  const handleLeave = () => {
    leaveLobby();
    navigate({ to: '/' });
  };

  const handleBuzzerClick = () => {
    buzz(lobbyId, username);
  };

  const handleGuessSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!guessInput.trim()) return;
    submitGuess(lobbyId, username, guessInput.trim());
    setGuessInput('');
  };

  const handleGapSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentSong = gameState?.currentSong;
    const gapBlocks = parseGapBlocks(currentSong?.lyricsGap);
    const answers = gapBlocks.map((block) => (gapInputs[block.id] || '').trim());
    submitGapAnswers(lobbyId, username, answers);
  };

  return {
    navigate,
    sessionData,
    isConnected,
    gameState,
    error,
    buzzerWinner,
    isHost,
    isBuzzerWinner,
    selectedGameMode,
    setSelectedGameMode,
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
    handleBuzzerClick,
    handleGuessSubmit,
    handleGapSubmit,
    forceRevealAnswer: () => forceRevealAnswer(lobbyId),
    nextSong: () => nextSong(lobbyId),
    startGame: (mode?: string) => startGame(lobbyId, mode),
    restartGame: () => restartGame(lobbyId),
    setGameMode: (mode: string) => setGameMode(lobbyId, mode),
  };
}
