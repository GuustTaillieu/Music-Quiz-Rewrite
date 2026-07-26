import { createFileRoute } from '@tanstack/react-router';
import { GuestJoinPortal } from '#/features/guest-join';

export const Route = createFileRoute('/join')({
  component: JoinRouteComponent,
});

function JoinRouteComponent() {
  return <GuestJoinPortal />;
}
