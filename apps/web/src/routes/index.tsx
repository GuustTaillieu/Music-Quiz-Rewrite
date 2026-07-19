import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useDashboard } from '#/hooks/useDashboard';
import { Music, Play, Plus, LogOut, Headphones, Pencil, ArrowLeft, Loader2 } from 'lucide-react';
import { BsMusicNoteList, BsSpotify } from "react-icons/bs";

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const {
    lobbyCode,
    guestName,
    setGuestName,
    joinError,
    sessionData,
    isSessionLoading,
    isLoggedIn,
    quizzes,
    isQuizzesLoading,
    activeSessions,
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
  } = useDashboard();

  if (isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: GUEST JOIN PORTAL (LOGGED OUT)
  // ==========================================
  if (!isLoggedIn && (step === 'code' || step === 'name')) {
    return (
      <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-6 bg-[#05070f]">
        {/* Synthwave grid background */}
        <div className="synth-grid absolute inset-0 pointer-events-none" />

        <div className="w-full max-w-md sm:bg-black/60 sm:border border-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 z-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

          {step === 'code' ? (
            <div className="flex flex-col items-center">
              {/* Headphones Green Badge */}
              <div className="inline-flex items-center justify-center p-4 bg-[#1DB954]/10 rounded-2xl border border-[#1DB954]/30 text-[#1DB954] mb-3 shadow-[0_0_15px_rgba(29,185,84,0.15)]">
                <Headphones size={36} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">SoundQuiz</h2>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-12">Powered by Spotify</span>

              <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
                Music trivia,<br />
                <span className="text-[#1DB954]">done right.</span>
              </h1>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-8">
                Build quizzes from your Spotify library and challenge friends with live multiplayer rounds.
              </p>

              {/* Login option */}
              <button
                onClick={handleSpotifyLogin}
                className="w-full bg-spotify/80 hover:bg-spotify text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(29,185,84,0.3)] active:scale-98 flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#1ed760]/20 mb-8"
              >
                <BsSpotify size={16} /> Sign In with Spotify
              </button>

              <div className="w-full flex items-center gap-3 mb-6">
                <div className="h-px bg-cyan-500/10 flex-1" />
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">have a join code?</span>
                <div className="h-px bg-cyan-500/10 flex-1" />
              </div>

              {/* Monospace Code Input */}
              <div className="relative w-full mb-3">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="XXXX"
                  value={lobbyCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={isCodeValidating}
                  className={`w-full bg-black/40 border rounded-xl px-4 py-3.5 font-mono font-black text-center text-2xl uppercase placeholder-cyan-500/10 focus:outline-none transition-all ${isCodeInvalid
                    ? 'border-rose-500 text-rose-500 focus:border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : 'border-cyan-500/20 text-[#00f0ff] focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]'
                    }`}
                  style={{ letterSpacing: '0.6em' }}
                />
                {isCodeValidating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 size={20} className="animate-spin text-cyan-400" />
                  </div>
                )}
              </div>

              {joinError ? (
                <p className="text-[11px] font-bold text-rose-500">{joinError}</p>
              ) : (
                <div className="text-[10px] text-muted-foreground/60 leading-normal">
                  Spotify Premium required to create quizzes<br />
                  Guests can join and play any quiz
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start text-left">
              {/* Back Button */}
              <button
                onClick={() => setStep('code')}
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold mb-6 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <h2 className="text-2xl font-black text-white mb-1">Enter Nickname</h2>
              <p className="text-muted-foreground text-xs mb-6">
                Joining quiz lobby <span className="text-[#00f0ff] font-bold">{lobbyCode}</span>
              </p>

              <form onSubmit={handleJoinLobby} className="w-full space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Choose your username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter a username..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    autoFocus
                    className="w-full bg-black/40 border border-cyan-500/20 text-white rounded-xl px-4 py-3 font-medium placeholder-cyan-500/20 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]"
                  />
                </div>

                {joinError && (
                  <p className="text-xs font-bold text-rose-500">{joinError}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-98 transition-all text-black font-black uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Play size={16} fill="currentColor" /> Enter Lobby
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LOGGED IN USER (QUIZZES OVERVIEW)
  // ==========================================
  return (
    <div className="relative w-full min-h-screen pb-16 flex flex-col bg-[#05070f] text-white">
      {/* Synthwave static grid backdrop */}
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-40" />

      {/* Top Premium Navbar */}
      <header className="relative w-full border-b border-cyan-500/10 bg-black/40 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl text-[#1DB954]">
            <Headphones size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-md leading-none text-white tracking-tight">soundquiz</h1>
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5 block">Host Console</span>
          </div>
        </div>

        {/* User Badge / Actions */}
        {sessionData && (
          <div className="flex items-center gap-3 bg-black/40 border border-cyan-500/10 rounded-2xl py-1.5 pl-2.5 pr-1.5">
            <div className="flex items-center gap-2">
              {sessionData.user.image ? (
                <img
                  src={sessionData.user.image}
                  alt={sessionData.user.name}
                  className="h-7 w-7 rounded-full border border-cyan-500/20"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  {sessionData.user.name.slice(0, 1)}
                </div>
              )}
              <span className="text-xs font-bold text-muted-foreground pr-1 hidden sm:inline">
                {sessionData.user.name}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </header>

      {/* Main Page Area */}
      <main className="w-full max-w-4xl mx-auto px-6 py-10 z-10 flex-1">

        {/* Rejoin Banner */}
        {activeSessions && activeSessions.length > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              <div>
                <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider leading-none">Active Quiz Running</h4>
                <p className="text-xs text-muted-foreground mt-1">Lobby Code: <strong className="text-white">{activeSessions[0].lobbyId}</strong> &bull; {activeSessions[0].quizTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to stop this game fully? This will disconnect all players.')) {
                    terminateLobbyMutation.mutate(activeSessions[0].lobbyId);
                  }
                }}
                className="flex-1 sm:flex-initial border border-amber-500/35 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-400 text-amber-500 text-xs font-black uppercase tracking-wider px-5 py-2 rounded-xl transition-all cursor-pointer"
              >
                Stop Game Fully
              </button>
              <button
                onClick={() =>
                  navigate({
                    to: '/lobby/$lobbyId',
                    params: { lobbyId: activeSessions[0].lobbyId },
                    search: { username: sessionData?.user.name ?? 'Host' },
                  })
                }
                className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] text-black text-xs font-black uppercase tracking-wider px-5 py-2 rounded-xl transition-all cursor-pointer"
              >
                Resume Game
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-cyan-500/10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">My Quizzes</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {quizzes?.length ?? 0} {quizzes?.length === 1 ? 'quiz' : 'quizzes'} created &bull; Host live games and edit songs
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Guest Join Entry */}
            <div className="relative">
              <input
                type="text"
                maxLength={4}
                placeholder="Join Code"
                value={lobbyCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="bg-black/40 border border-cyan-500/20 text-[#00f0ff] uppercase rounded-xl py-2 px-3 text-xs w-28 text-center font-bold focus:outline-none focus:border-[#00f0ff]"
              />
              {isCodeValidating && (
                <Loader2 size={12} className="animate-spin text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl hover:shadow-[0_0_15px_rgba(29,185,84,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} /> New Quiz
            </button>
          </div>
        </div>

        {/* Quizzes List */}
        {isQuizzesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-cyan-400 border-t-transparent" />
            <span className="text-xs text-muted-foreground">Loading catalog...</span>
          </div>
        ) : quizzes && quizzes.length > 0 ? (
          <div className="space-y-4">
            {quizzes.map((quiz, qIdx) => {
              // Generate pseudo-random gradient colors for music squares
              const blocks = [
                { bg: 'from-pink-500 to-rose-600', text: 'text-white' },
                { bg: 'from-purple-500 to-indigo-600', text: 'text-white' },
                { bg: 'from-cyan-500 to-blue-600', text: 'text-white' },
                { bg: 'from-amber-400 to-orange-500', text: 'text-black' },
              ];
              const blockColor = blocks[qIdx % blocks.length];

              return (
                <div
                  key={quiz.id}
                  className="bg-[#0b0e17]/80 border border-cyan-500/10 hover:border-cyan-500/25 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:translate-y-[-2px] shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                >
                  {/* Info Block */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${blockColor.bg} flex items-center justify-center font-bold text-lg shadow-md`}>
                      <BsMusicNoteList size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base leading-tight truncate mb-1">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {quiz.description || 'No description provided'}
                      </p>
                      {/* Meta information tags */}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <span>🎵 {quiz.songCount ?? 0} {(quiz.songCount ?? 0) === 1 ? 'song' : 'songs'}</span>
                        <span>&bull;</span>
                        <span>📅 {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    {/* Pencil Edit button */}
                    <button
                      onClick={() =>
                        navigate({
                          to: '/studio/$quizId',
                          params: { quizId: quiz.id },
                        })
                      }
                      className="flex-1 md:flex-initial border border-cyan-500/25 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-400 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Pencil size={12} /> Studio
                    </button>
                    {/* Host Play button */}
                    <button
                      onClick={() => handleCreateLobby(quiz.id)}
                      className="flex-1 md:flex-initial bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(29,185,84,0.35)] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play size={12} fill="currentColor" /> Play
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-cyan-500/10 rounded-3xl bg-[#0b0e17]/50 max-w-md mx-auto">
            <Music size={40} className="mx-auto text-cyan-400/30 mb-4 animate-pulse" />
            <h3 className="font-bold text-white text-lg mb-2">No quizzes available</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6">
              Create a custom Spotify quiz library to host live multiplayer trivia rounds with friends.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer"
            >
              Create Your First Quiz
            </button>
          </div>
        )}
      </main>

      {/* QUIZ CREATION OVERLAY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-[#0b0e17] border border-cyan-500/20 max-w-md w-full rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white mb-1">Create New Quiz</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Enter quiz details to start building your track library.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTitle.trim()) return;
                createQuizMutation.mutate({
                  title: newTitle.trim(),
                  description: newDescription.trim(),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2020s Pop Bangers"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-500/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder-cyan-500/10 focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="e.g. Guess the artist and fill in the missing lyrics..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-black/40 border border-cyan-500/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder-cyan-500/10 focus:outline-none focus:border-[#00f0ff] min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewTitle('');
                    setNewDescription('');
                  }}
                  className="flex-1 border border-cyan-500/20 hover:bg-cyan-500/5 text-muted-foreground font-black text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createQuizMutation.isPending || !newTitle.trim()}
                  className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 disabled:text-black/50 text-black font-black text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {createQuizMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Create Quiz'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
