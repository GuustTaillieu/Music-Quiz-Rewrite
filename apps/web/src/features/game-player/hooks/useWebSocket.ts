import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(url, {
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [url]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const registerHandler = useCallback(
    <T>(event: string, callback: (data: T) => void) => {
      const socket = socketRef.current;
      if (socket) {
        socket.on(event, callback);
      }
      return () => {
        if (socket) {
          socket.off(event, callback);
        }
      };
    },
    [],
  );

  return {
    isConnected,
    emit,
    registerHandler,
    socket: socketRef.current,
  };
}
