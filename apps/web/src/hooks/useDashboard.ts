import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '#/lib/auth-client';
import { apiFetch } from '#/lib/api';
import { quizzesQueryOptions } from '#/queries/quizzes';
import { z } from 'zod';

const createLobbyResponseSchema = z.object({
  lobbyId: z.string(),
});

export function useDashboard() {
  const navigate = useNavigate();
  const [lobbyCode, setLobbyCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [joinError, setJoinError] = useState('');

  // Better-Auth Session
  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();

  const isLoggedIn = !!sessionData?.user;

  // Reusable QueryOptions call
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery(
    quizzesQueryOptions(isLoggedIn),
  );

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    const code = lobbyCode.trim().toUpperCase();
    const name = guestName.trim();

    if (code.length !== 4) {
      setJoinError('Lobby code must be exactly 4 letters.');
      return;
    }
    if (!name) {
      setJoinError('Please enter a username.');
      return;
    }

    navigate({
      to: '/lobby/$lobbyId',
      params: { lobbyId: code },
      search: { username: name },
    });
  };

  const handleCreateLobby = async (quizId: string) => {
    const { data, error } = await apiFetch('/api/game/lobby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quizId }),
      schema: createLobbyResponseSchema,
    });

    if (error) {
      console.error(error);
      alert('Could not start lobby. Make sure you are logged in.');
      return;
    }

    navigate({
      to: '/lobby/$lobbyId',
      params: { lobbyId: data.lobbyId },
      search: { username: sessionData?.user.name ?? 'Host' },
    });
  };

  const handleSpotifyLogin = async () => {
    await authClient.signIn.social({
      provider: 'spotify',
      callbackURL: window.location.origin,
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  return {
    lobbyCode,
    setLobbyCode,
    guestName,
    setGuestName,
    joinError,
    sessionData,
    isSessionLoading,
    isLoggedIn,
    quizzes,
    isQuizzesLoading,
    handleJoinLobby,
    handleCreateLobby,
    handleSpotifyLogin,
    handleSignOut,
  };
}
