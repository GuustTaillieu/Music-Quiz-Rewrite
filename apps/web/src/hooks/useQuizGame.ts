import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import type { GameSessionState } from '@spotify-music-quiz/shared/schema/game';

export function useQuizGame(wsUrl: string) {
  const { isConnected, emit, registerHandler } = useWebSocket(wsUrl);
  const [gameState, setGameState] = useState<GameSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastGuessResult, setLastGuessResult] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubState = registerHandler<GameSessionState>(
      'game_state_update',
      (state) => {
        setGameState(state);
        setError(null);
      },
    );

    const unsubJoinSuccess = registerHandler<{
      lobbyId: string;
      state: GameSessionState;
    }>('join_success', ({ state }) => {
      setGameState(state);
      setError(null);
    });

    const unsubJoinError = registerHandler<{ message: string }>(
      'join_error',
      ({ message }) => {
        setError(message);
      },
    );

    const unsubError = registerHandler<{ message: string }>('error', ({ message }) => {
      setError(message);
    });

    const unsubGuessResult = registerHandler<{ correct: boolean }>(
      'guess_result',
      ({ correct }) => {
        setLastGuessResult(correct);
        setTimeout(() => setLastGuessResult(null), 3000); // clear after 3 seconds
      },
    );

    return () => {
      unsubState();
      unsubJoinSuccess();
      unsubJoinError();
      unsubError();
      unsubGuessResult();
    };
  }, [registerHandler]);

  const joinLobby = useCallback(
    (lobbyId: string, username: string, userId?: string) => {
      setError(null);
      emit('join_lobby', { lobbyId, username, userId });
    },
    [emit],
  );

  const startGame = useCallback(() => {
    emit('game_start');
  }, [emit]);

  const submitGuess = useCallback(
    (guess: string) => {
      emit('submit_guess', { guess });
    },
    [emit],
  );

  const passTurn = useCallback(() => {
    emit('pass_turn');
  }, [emit]);

  const nextSong = useCallback(() => {
    emit('next_song');
  }, [emit]);

  const configureLobby = useCallback(
    (gameMode: 'SPEED_MODE' | 'TURN_BASED', guessingTimeLimit: number) => {
      emit('configure_lobby', { gameMode, guessingTimeLimit });
    },
    [emit],
  );

  const forceReveal = useCallback(() => {
    emit('force_reveal');
  }, [emit]);

  const endGame = useCallback(() => {
    emit('end_game');
  }, [emit]);

  return {
    isConnected,
    gameState,
    error,
    lastGuessResult,
    joinLobby,
    startGame,
    submitGuess,
    passTurn,
    nextSong,
    configureLobby,
    forceReveal,
    endGame,
  };
}
