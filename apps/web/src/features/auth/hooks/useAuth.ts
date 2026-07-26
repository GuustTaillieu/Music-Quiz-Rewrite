import { useState } from 'react';
import { authClient } from '../api/auth-client';

export function useAuth() {
  const sessionQuery = authClient.useSession();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const signInWithSpotify = async (callbackURL?: string) => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      await authClient.signIn.social({
        provider: 'spotify',
        callbackURL: callbackURL || window.location.origin,
      });
    } catch (err: any) {
      setLoginError(err.message || 'Failed to sign in with Spotify');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  return {
    session: sessionQuery.data,
    user: sessionQuery.data?.user ?? null,
    isLoggedIn: Boolean(sessionQuery.data?.user),
    isSessionLoading: sessionQuery.isPending,
    sessionError: sessionQuery.error,
    signOut,
    refetch: sessionQuery.refetch,
    signInWithSpotify,
    isLoggingIn,
    loginError,
  };
}
