import { createFileRoute } from '@tanstack/react-router';
import { useDashboardController } from '#/features/dashboard/hooks/useDashboardController';
import { GuestJoinPortal } from '#/features/dashboard/components/GuestJoinPortal';
import { HostDashboardView } from '#/features/dashboard/components/HostDashboardView';

export const Route = createFileRoute('/')({
  component: DashboardRouteComponent,
});

function DashboardRouteComponent() {
  const dashboard = useDashboardController();

  if (dashboard.isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!dashboard.isLoggedIn) {
    return (
      <GuestJoinPortal
        step={dashboard.step}
        setStep={dashboard.setStep}
        lobbyCode={dashboard.lobbyCode}
        guestName={dashboard.guestName}
        setGuestName={dashboard.setGuestName}
        isCodeValidating={dashboard.isCodeValidating}
        isCodeInvalid={dashboard.isCodeInvalid}
        joinError={dashboard.joinError}
        socialLoginError={dashboard.socialLoginError}
        handleCodeChange={dashboard.handleCodeChange}
        handleJoinLobby={dashboard.handleJoinLobby}
        handleSpotifyLogin={dashboard.handleSpotifyLogin}
      />
    );
  }

  return (
    <HostDashboardView
      sessionData={dashboard.sessionData}
      activeSessions={dashboard.activeSessions}
      terminateLobbyMutation={dashboard.terminateLobbyMutation}
      quizzes={dashboard.quizzes}
      isQuizzesLoading={dashboard.isQuizzesLoading}
      lobbyCode={dashboard.lobbyCode}
      handleCodeChange={dashboard.handleCodeChange}
      isCodeValidating={dashboard.isCodeValidating}
      isCreateModalOpen={dashboard.isCreateModalOpen}
      setIsCreateModalOpen={dashboard.setIsCreateModalOpen}
      newTitle={dashboard.newTitle}
      setNewTitle={dashboard.setNewTitle}
      newDescription={dashboard.newDescription}
      setNewDescription={dashboard.setNewDescription}
      createQuizMutation={dashboard.createQuizMutation}
      handleCreateLobby={dashboard.handleCreateLobby}
      refetchQuizzes={dashboard.refetchQuizzes}
    />
  );
}
