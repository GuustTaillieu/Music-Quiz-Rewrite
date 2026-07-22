import { authClient } from '../api/auth-client';

export function useAuth() {
  const { data: sessionData, isPending: isSessionLoading } = authClient.useSession();
  const isLoggedIn = !!sessionData?.user;

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
    sessionData,
    isSessionLoading,
    isLoggedIn,
    handleSpotifyLogin,
    handleSignOut,
  };
}
