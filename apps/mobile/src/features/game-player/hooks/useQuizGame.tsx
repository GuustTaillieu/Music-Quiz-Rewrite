import { GAME_EVENTS } from '@spotify-music-quiz/shared/constants/game-events';
import type { GameSessionState } from '@spotify-music-quiz/shared/schema/game';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { usePlayerSession } from './usePlayerSession';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';

interface QuizGameContextType {
  isConnected: boolean;
  gameState: GameSessionState | null;
  error: string | null;
  lastGuessResult: boolean | null;
  joinLobby: (lobbyId: string) => void;
  leaveLobby: (callback?: () => void) => void;
  passTurn: () => void;
  submitGuess: (guess: string) => void;
}

const QuizGameContext = createContext<QuizGameContextType | undefined>(undefined);

export function QuizGameProvider({ children }: { children: ReactNode }) {
  const { username, setToken, getToken, clearSession } = usePlayerSession()
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastGuessResult, setLastGuessResult] = useState<boolean | null>(null);

  useEffect(() => {
    const socketInstance = io(BACKEND_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on(GAME_EVENTS.GAME_STATE_UPDATE, (state: GameSessionState) => {
      setGameState(state);
    });

    socketInstance.on(GAME_EVENTS.JOIN_SUCCESS, ({ lobbyId, state, playerSessionToken }) => {
      setGameState(state);
      setError(null);
      if (playerSessionToken) setToken(lobbyId, playerSessionToken)
    });

    socketInstance.on(GAME_EVENTS.JOIN_ERROR, ({ message }: { message: string }) => {
      setError(message);
      setGameState(null);
    });

    socketInstance.on(GAME_EVENTS.ERROR, ({ message }: { message: string }) => {
      setError(message);
    });

    socketInstance.on(GAME_EVENTS.GUESS_RESULT, ({ correct }: { correct: boolean }) => {
      setLastGuessResult(correct);
      setTimeout(() => setLastGuessResult(null), 3000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinLobby = useCallback(
    async (lobbyId: string) => {
      if (!socket) return;
      const token = await getToken(lobbyId)
      socket.emit(GAME_EVENTS.JOIN_LOBBY, {
        lobbyId,
        username: username.trim(),
        token
      });
    },
    [socket, username],
  );

  const leaveLobby = useCallback(
    async (callback?: () => void) => {
      if (!gameState) return;
      await clearSession(gameState.lobbyId);
      setGameState(null);
      callback?.();
    },
    [gameState, clearSession],
  );

  const passTurn = useCallback(() => {
    socket?.emit(GAME_EVENTS.PASS_TURN);
  }, [socket]);

  const submitGuess = useCallback(
    (guess: string) => {
      socket?.emit(GAME_EVENTS.SUBMIT_GUESS, { guess });
    },
    [socket],
  );

  return (
    <QuizGameContext.Provider
      value={{
        isConnected,
        gameState,
        error,
        lastGuessResult,
        joinLobby,
        leaveLobby,
        passTurn,
        submitGuess,
      }}
    >
      {children}
    </QuizGameContext.Provider>
  );
}

export function useQuizGame() {
  const context = useContext(QuizGameContext);
  if (!context) {
    throw new Error('useQuizGame must be used within a QuizGameProvider');
  }
  return context;
}
