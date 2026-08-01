import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { GuestJoinPortal } from '#/features/guest-join';
import { getSessionFn } from '#/features/auth';

const joinSearchSchema = z.object({
  lobbyId: z.coerce.string().optional(),
});

export const Route = createFileRoute('/join')({
  validateSearch: joinSearchSchema,
  component: JoinRouteComponent,
  beforeLoad: async () => {
    const data = await getSessionFn();
    if (data?.user) {
      throw redirect({
        to: '/',
        replace: true
      })
    }
  }
});

function JoinRouteComponent() {
  const { lobbyId } = Route.useSearch();
  return <GuestJoinPortal initialLobbyCode={lobbyId} />;
}
