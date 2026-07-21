import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '#/lib/auth-client';
import { apiFetch } from '#/lib/api';
import { quizzesQueryOptions } from '#/queries/quizzes';
import { z } from 'zod';

const createLobbyResponseSchema = z.object({
  lobbyId: z.string(),
});

export function useDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lobbyCode, setLobbyCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [socialLoginError, setSocialLoginError] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const err = searchParams.get('error');
      if (err === 'premium_required') {
        return 'Spotify Premium account is required to host games.';
      }
      if (err) {
        return 'Sign-in failed. Please try again.';
      }
    }
    return '';
  });
  const [step, setStep] = useState<'code' | 'name'>('code');
  const [isCodeValidating, setIsCodeValidating] = useState(false);
  const [isCodeInvalid, setIsCodeInvalid] = useState(false);

  // Quiz Creation States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const createQuizMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const { data: res, error } = await apiFetch<any>('/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (error) throw error;
      return res;
    },
    onSuccess: (newQuiz) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      navigate({
        to: '/studio/$quizId',
        params: { quizId: newQuiz.id },
      });
    },
  });

  // Better-Auth Session
  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();

  const isLoggedIn = !!sessionData?.user;

  // Reusable QueryOptions call
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery(
    quizzesQueryOptions(isLoggedIn),
  );

  const { data: activeSessions, isLoading: isActiveSessionsLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const { data, error } = await apiFetch<Array<{ lobbyId: string; quizTitle: string }>>('/game/active');
      if (error) throw error;
      return data ?? [];
    },
    enabled: isLoggedIn,
    refetchInterval: 5000,
  });

  const handleCodeChange = async (val: string) => {
    const code = val.toUpperCase().slice(0, 4).replace(/[^A-Z]/g, '');
    setLobbyCode(code);
    setIsCodeInvalid(false);
    setJoinError('');

    if (code.length === 4) {
      setIsCodeValidating(true);
      const { data, error } = await apiFetch<{ exists: boolean }>(`/game/lobby/${code}/exists`);
      setIsCodeValidating(false);

      if (error || !data?.exists) {
        setIsCodeInvalid(true);
        setJoinError('Lobby not found. Check the code and try again.');
      } else {
        setStep('name');
      }
    }
  };

  const handleJoinLobby = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    const { data, error } = await apiFetch('/game/lobby', {
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

  const terminateLobbyMutation = useMutation({
    mutationFn: async (lobbyId: string) => {
      const { error } = await apiFetch(`/game/lobby/${lobbyId}`, {
        method: 'DELETE',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    },
  });

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
    socialLoginError,
    sessionData,
    isSessionLoading,
    isLoggedIn,
    quizzes,
    isQuizzesLoading,
    activeSessions,
    isActiveSessionsLoading,
    handleJoinLobby,
    handleCreateLobby,
    handleSpotifyLogin,
    handleSignOut,
    step,
    setStep,
    isCodeValidating,
    isCodeInvalid,
    handleCodeChange,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    createQuizMutation,
    terminateLobbyMutation,
  };
}
