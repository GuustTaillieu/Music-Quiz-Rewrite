import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '#/lib/auth-client';
import { apiFetch } from '#/lib/api';
import { quizzesQueryOptions } from '#/queries/quizzes';
import type { Quiz } from '@spotify-music-quiz/shared/schema/game';

export function useStudioIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();

  const isLoggedIn = !!sessionData?.user;

  // Reusable QueryOptions call
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery(
    quizzesQueryOptions(isLoggedIn),
  );

  const createQuizMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string }) => {
      const { data, error } = await apiFetch<Quiz>('/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          songs: [],
        }),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      navigate({
        to: '/studio/$quizId',
        params: { quizId: data.id },
      });
    },
  });

  // Delete mutation using apiFetch
  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await apiFetch(`/quizzes/${quizId}`, {
        method: 'DELETE',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });

  const handleCreateLobby = async (quizId: string) => {
    const { data, error } = await apiFetch<{ lobbyId: string }>('/game/lobby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quizId }),
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

  return {
    navigate,
    sessionData,
    isSessionLoading,
    isLoggedIn,
    quizzes,
    isQuizzesLoading,
    deleteMutation,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    createQuizMutation,
    handleCreateLobby,
  };
}
