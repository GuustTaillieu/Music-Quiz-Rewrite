import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '#/lib/auth-client';
import { LogIn, Music, Play, Plus, LogOut } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [lobbyCode, setLobbyCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [joinError, setJoinError] = useState('');

  // Get session using Better-Auth client hook
  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();

  // Fetch quizzes using TanStack Query if logged in
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes', {
        headers: {
          // Send request credentials if cookies are used
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      return res.json() as Promise<Array<{ id: string; title: string; description: string | null }>>;
    },
    enabled: !!sessionData?.user,
  });

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    const code = lobbyCode.trim().toUpperCase();
    const name = guestName.trim();

    if (code.length !== 4) {
      setJoinError('Lobby code must be exactly 4 letters.');
      return;
    }
    if (!name) {
      setJoinError('Please enter a username.');
      return;
    }

    // Navigate to the lobby page with search params
    navigate({
      to: '/lobby/$lobbyId',
      params: { lobbyId: code },
      search: { username: name },
    });
  };

  const handleCreateLobby = async (quizId: string) => {
    try {
      const res = await fetch('/api/game/lobby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId }),
      });

      if (!res.ok) {
        throw new Error('Failed to create lobby');
      }

      const data = (await res.json()) as { lobbyId: string };
      // Host joins under their user name
      navigate({
        to: '/lobby/$lobbyId',
        params: { lobbyId: data.lobbyId },
        search: { username: sessionData?.user.name ?? 'Host' },
      });
    } catch (err: unknown) {
      console.error(err);
      alert('Could not start lobby. Make sure you are logged in.');
    }
  };

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

  if (isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  const isLoggedIn = !!sessionData?.user;

  return (
    <div className="page-wrap min-h-screen py-12 flex flex-col items-center justify-center">
      {/* Header Branding */}
      <div className="text-center mb-10 rise-in">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-lagoon to-lagoon-deep rounded-2xl shadow-lg mb-4 text-white">
          <Music size={40} className="animate-pulse" />
        </div>
        <h1 className="display-title text-5xl font-black tracking-tight text-foreground">
          Spotify Music Quiz
        </h1>
        <p className="text-muted-foreground text-lg mt-2 font-medium">
          Decoupled Real-time Multiplayer Quiz Game
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl rise-in">
        {/* Join Lobby Panel */}
        <div className="island-shell p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <h2 className="display-title text-2xl font-bold text-foreground mb-2">
              Join a Game
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Connect to a friend's quiz lobby as a guest to play.
            </p>
            <form onSubmit={handleJoinLobby} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Lobby Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. ABCD"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value)}
                  className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-3 font-black tracking-widest text-center text-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-lagoon"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Your Nickname
                </label>
                <input
                  type="text"
                  placeholder="Enter a username"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-3 font-medium text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-lagoon"
                />
              </div>

              {joinError && (
                <div className="text-sm font-semibold text-destructive mt-2">
                  {joinError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-3.5 px-6 rounded-xl hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={18} /> Join Lobby
              </button>
            </form>
          </div>
        </div>

        {/* Host / Auth Panel */}
        <div className="island-shell p-8 rounded-3xl flex flex-col justify-between">
          {!isLoggedIn ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                <h2 className="display-title text-2xl font-bold text-foreground mb-2">
                  Host a Game
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Log in with your Spotify Premium account to build customized song quizzes and host live game lobbies.
                </p>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
                  Spotify Premium is required for game creators and lobby hosts to control playback. Guests join for free.
                </div>
              </div>
              <button
                onClick={handleSpotifyLogin}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-black py-4 px-6 rounded-xl hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn size={20} /> Sign In with Spotify
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between space-y-6">
              <div>
                {/* User info */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    {sessionData.user.image && (
                      <img
                        src={sessionData.user.image}
                        alt={sessionData.user.name}
                        className="h-10 w-10 rounded-full border border-line"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-foreground text-sm leading-tight">
                        {sessionData.user.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">Host Mode Active</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-foreground text-sm">Your Quizzes</h4>
                  <button
                    onClick={() => navigate({ to: '/studio' })}
                    className="text-xs font-bold text-lagoon-deep hover:text-lagoon flex items-center gap-1"
                  >
                    <Plus size={14} /> Open Studio
                  </button>
                </div>

                {isQuizzesLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
                  </div>
                ) : quizzes && quizzes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-foam/10 border border-line hover:border-lagoon transition-colors"
                      >
                        <div className="truncate pr-3">
                          <h5 className="font-bold text-foreground text-xs leading-none truncate mb-1">
                            {quiz.title}
                          </h5>
                          <p className="text-[10px] text-muted-foreground leading-none truncate">
                            {quiz.description || 'No description'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCreateLobby(quiz.id)}
                          className="bg-lagoon hover:bg-lagoon-deep text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Play size={12} /> Host
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-line rounded-2xl bg-foam/10">
                    <p className="text-xs text-muted-foreground mb-3">No quizzes created yet.</p>
                    <button
                      onClick={() => navigate({ to: '/studio' })}
                      className="bg-lagoon hover:bg-lagoon-deep text-white text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      Create First Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
