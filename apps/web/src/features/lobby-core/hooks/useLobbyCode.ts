import { useState } from 'react';
import { lobbyApi } from '../api/lobbyApi';

export function useLobbyCode(onValidCode?: (code: string) => void) {
  const [lobbyCode, setLobbyCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCodeChange = async (code: string) => {
    setLobbyCode(code);
    setIsInvalid(false);
    setErrorMessage('');

    if (code.length === 6) {
      setIsValidating(true);
      try {
        const exists = await lobbyApi.verifyLobbyExists(code);
        setIsValidating(false);
        if (exists) {
          if (onValidCode) onValidCode(code);
        } else {
          setIsInvalid(true);
          setErrorMessage('Game lobby not found or session has ended.');
        }
      } catch (err: any) {
        setIsValidating(false);
        setIsInvalid(true);
        setErrorMessage(err.message || 'Failed to verify lobby code.');
      }
    }
  };

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
    resetCode,
  };
}
