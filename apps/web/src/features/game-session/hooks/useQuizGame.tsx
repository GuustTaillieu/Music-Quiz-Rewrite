import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useWebSocket } from '../../game-player/hooks/useWebSocket';
import type { GameMode, GameSessionState } from '@spotify-music-quiz/shared/schema/game';
import { GAME_CONFIG } from '#/features/shared/constants/gameConfig';
import { GAME_EVENTS } from '@spotify-music-quiz/shared/constants/game-events';

interface QuizGameContextType {
  isConnected: boolean;
  gameState: GameSessionState | null;
  error: string | null;
  lastGuessResult: boolean | null;
  joinLobby: (lobbyId: string, username: string, userId?: string) => void;
  leaveLobby: (callback?: () => void) => void;
  startGame: () => void;
  startAudioTimer: () => void;
  submitGuess: (guess: string) => void;
  passTurn: () => void;
  nextSong: () => void;
  forceReveal: () => void;
  endGame: () => void;
  isUserHost: (userId?: string) => boolean;
  selectGameMode: (gameMode: GameMode) => void;
}

const QuizGameContext = createContext<QuizGameContextType | null>(null);

export function QuizGameProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, emit, registerHandler } = useWebSocket(GAME_CONFIG.WS_URL);
  const [gameState, setGameState] = useState<GameSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastGuessResult, setLastGuessResult] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubState = registerHandler<GameSessionState>(
      GAME_EVENTS.GAME_STATE_UPDATE,
      (state) => {
        setGameState(state);
        setError(null);
      },
    );

    const unsubJoinSuccess = registerHandler<{
      lobbyId: string;
      state: GameSessionState;
    }>(GAME_EVENTS.JOIN_SUCCESS, ({ state }) => {
      setGameState(state);
      setError(null);
    });

    const unsubJoinError = registerHandler<{ message: string }>(
      GAME_EVENTS.JOIN_ERROR,
      ({ message }) => {
        setError(message);
      },
    );

    const unsubError = registerHandler<{ message: string }>(GAME_EVENTS.ERROR, ({ message }) => {
      setError(message);
    });

    const unsubGuessResult = registerHandler<{ correct: boolean }>(
      GAME_EVENTS.GUESS_RESULT,
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
      emit(GAME_EVENTS.JOIN_LOBBY, { lobbyId, username, userId });
    },
    [emit],
  );

  const leaveLobby = useCallback((callback?: () => void) => {
    endGame();
    callback?.();
  }, []);

  const startGame = useCallback(() => {
    emit(GAME_EVENTS.GAME_START);
  }, [emit]);

  const submitGuess = useCallback(
    (guess: string) => {
      emit(GAME_EVENTS.SUBMIT_GUESS, { guess });
    },
    [emit],
  );

  const passTurn = useCallback(() => {
    emit(GAME_EVENTS.PASS_TURN);
  }, [emit]);

  const nextSong = useCallback(() => {
    emit(GAME_EVENTS.NEXT_SONG);
  }, [emit]);

  const forceReveal = useCallback(() => {
    emit(GAME_EVENTS.FORCE_REVEAL);
  }, [emit]);

  const endGame = useCallback(() => {
    emit(GAME_EVENTS.END_GAME);
  }, [emit]);

  const startAudioTimer = useCallback(() => {
    emit(GAME_EVENTS.HOST_AUDIO_STARTED);
  }, [emit]);

  const isUserHost = useCallback((userId?: string) => gameState
    ? Boolean(userId && userId === gameState.hostId)
    : false, [gameState]);

  const selectGameMode = useCallback((gameMode: GameMode) => {
    emit(GAME_EVENTS.CONFIGURE_LOBBY, { gameMode, guessingTimeLimit: gameState?.guessingTimeLimit ?? 30 });
  }, [emit, gameState])

  return (
    <QuizGameContext.Provider value={{
      isConnected,
      gameState,
      error,
      lastGuessResult,
      joinLobby,
      leaveLobby,
      startGame,
      startAudioTimer,
      submitGuess,
      passTurn,
      nextSong,
      forceReveal,
      endGame,
      isUserHost,
      selectGameMode
    }}>
      {children}
    </QuizGameContext.Provider>
  )
}

export function useQuizGame() {
  const context = useContext(QuizGameContext);
  if (!context) throw new Error('useQuizGame must be used within a QuizGameProvider');
  return context;
}
