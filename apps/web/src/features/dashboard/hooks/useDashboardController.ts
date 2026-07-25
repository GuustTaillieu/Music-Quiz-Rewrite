import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '#/features/auth/api/auth-client';
import { dashboardQueries } from '../api/dashboardQueries';
import { dashboardMutations } from '../api/dashboardMutations';
import { dashboardService } from '../api/dashboardService';
import { DASHBOARD_CONSTANTS } from '../constants/dashboardConstants';

export function useDashboardController() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lobbyCode, setLobbyCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [socialLoginError] = useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const err = searchParams.get('error');
      if (err === 'premium_required') {
        return DASHBOARD_CONSTANTS.ERRORS.PREMIUM_REQUIRED;
      }
      if (err) {
        return DASHBOARD_CONSTANTS.ERRORS.SIGNIN_FAILED;
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
    ...dashboardMutations.createQuiz(),
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

  const { data: sessionData, isPending: isSessionLoading } = authClient.useSession();
  const isLoggedIn = !!sessionData?.user;

  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery(
    dashboardQueries.quizzes(isLoggedIn),
  );

  const { data: activeSessions, isLoading: isActiveSessionsLoading } = useQuery(
    dashboardQueries.activeSessions(isLoggedIn),
  );

  const handleCodeChange = async (val: string) => {
    const code = val.toUpperCase().slice(0, DASHBOARD_CONSTANTS.LOBBY_CODE_MAX_LENGTH).replace(/[^A-Z]/g, '');
    setLobbyCode(code);
    setIsCodeInvalid(false);
    setJoinError('');

    if (code.length === DASHBOARD_CONSTANTS.LOBBY_CODE_MAX_LENGTH) {
      setIsCodeValidating(true);
      const exists = await dashboardService.verifyLobbyExists(code);
      setIsCodeValidating(false);

      if (!exists) {
        setIsCodeInvalid(true);
        setJoinError(DASHBOARD_CONSTANTS.ERRORS.LOBBY_NOT_FOUND);
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

    if (code.length !== DASHBOARD_CONSTANTS.LOBBY_CODE_MAX_LENGTH) {
      setJoinError(DASHBOARD_CONSTANTS.ERRORS.CODE_LENGTH_INVALID);
      return;
    }
    if (!name) {
      setJoinError(DASHBOARD_CONSTANTS.ERRORS.USERNAME_REQUIRED);
      return;
    }

    navigate({
      to: '/lobby/$lobbyId',
      params: { lobbyId: code },
      search: { username: name },
    });
  };

  const handleCreateLobby = async (quizId: string) => {
    try {
      const data = await dashboardService.createLobby(quizId);
      navigate({
        to: '/lobby/$lobbyId',
        params: { lobbyId: data.lobbyId },
        search: { username: sessionData?.user.name ?? 'Host' },
      });
    } catch (err) {
      console.error(err);
      alert(DASHBOARD_CONSTANTS.ERRORS.LOBBY_CREATE_FAILED);
    }
  };

  const handleSpotifyLogin = async () => {
    await authClient.signIn.social({
      provider: 'spotify',
      callbackURL: window.location.origin,
    });
  };

  const terminateLobbyMutation = useMutation({
    ...dashboardMutations.terminateLobby(),
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
    refetchQuizzes: () => queryClient.invalidateQueries({ queryKey: ['quizzes'] }),
  };
}
