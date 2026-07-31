import { GlobalVolumeWidget, SpotifyPlayerProvider } from '#/features/audio-player';
import { getSessionFn } from '#/features/auth';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: async () => {
    const data = await getSessionFn();
    if (!data?.user) {
      throw redirect({
        to: '/join',
      });
    }
    return {
      user: data.user,
      session: data.session,
    };
  },
});

function RouteComponent() {
  return (
    <SpotifyPlayerProvider>
      <Outlet />
      <GlobalVolumeWidget />
    </SpotifyPlayerProvider>
  )
}
