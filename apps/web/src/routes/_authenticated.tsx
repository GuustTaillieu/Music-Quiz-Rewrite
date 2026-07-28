import { SpotifyPlayerProvider } from '#/features/audio-player'
import { createFileRoute } from '@tanstack/react-router'
import { Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,

  // TODO: here i have to confirm that the user is logged in and than i can let him pass, if not, redirect to login
  // than i can add the user to the context of all routes under _authenticated
})

function RouteComponent() {
  return (
    <SpotifyPlayerProvider>
      <Outlet />
    </SpotifyPlayerProvider>
  )
}
