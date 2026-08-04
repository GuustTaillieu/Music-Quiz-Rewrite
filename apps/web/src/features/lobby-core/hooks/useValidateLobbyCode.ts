import { useState, useEffect, useCallback } from 'react';
import { lobbyApi } from '../api/lobbyApi';

export function useValidateLobbyCode(
  onValidCode?: (code: string) => void,
  initialCode?: string,
) {
  const [lobbyCode, setLobbyCode] = useState(initialCode ? initialCode.slice(0, 6).toUpperCase() : '');
  const [isValidating, setIsValidating] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCodeChange = useCallback(async (code: string) => {
    const cleanCode = code.toUpperCase();
    setLobbyCode(cleanCode);
    setIsInvalid(false);
    setErrorMessage('');

    if (cleanCode.length === 6) {
      setIsValidating(true);
      try {
        const exists = await lobbyApi.verifyLobbyExists(cleanCode);
        setIsValidating(false);
        if (exists) {
          if (onValidCode) onValidCode(cleanCode);
        } else {
          setIsInvalid(true);
          setErrorMessage('Game lobby not found or session has ended.');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to verify lobby code.';
        setIsValidating(false);
        setIsInvalid(true);
        setErrorMessage(message);
      }
    }
  }, [onValidCode]);

  useEffect(() => {
    if (initialCode && initialCode.length === 6) {
      handleCodeChange(initialCode);
    }
  }, [initialCode, handleCodeChange]);

  const resetCode = () => {
    setLobbyCode('');
    setIsValidating(false);
    setIsInvalid(false);
    setErrorMessage('');
  };

  return {
    lobbyCode,
    setLobbyCode,
    isValidating,
    isInvalid,
    errorMessage,
    handleCodeChange,
    resetCode
  };
}
