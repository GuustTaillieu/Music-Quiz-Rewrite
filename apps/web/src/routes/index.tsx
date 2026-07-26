import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '#/features/auth';
import { HostDashboardView } from '#/features/host-dashboard';

export const Route = createFileRoute('/')({
  component: DashboardRouteComponent,
});

function DashboardRouteComponent() {
  const { isLoggedIn, isSessionLoading: isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate({ to: '/join' });
    }
  }, [isLoading, isLoggedIn, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <HostDashboardView />;
}
