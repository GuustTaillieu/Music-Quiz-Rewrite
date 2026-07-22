import { useNavigate } from '@tanstack/react-router';
import { Headphones, LogOut, Loader2, Plus, Music, Pencil, Play } from 'lucide-react';
import { BsMusicNoteList } from 'react-icons/bs';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import { ActiveSessionsTable } from './ActiveSessionsTable';
import { CreateQuizModal } from './CreateQuizModal';
import type { QuizMeta, ActiveSession } from '../api/dashboardService';

interface HostDashboardViewProps {
  sessionData: any;
  handleSignOut: () => void;
  activeSessions?: ActiveSession[];
  terminateLobbyMutation: any;
  quizzes?: QuizMeta[];
  isQuizzesLoading: boolean;
  lobbyCode: string;
  handleCodeChange: (val: string) => void;
  isCodeValidating: boolean;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  newDescription: string;
  setNewDescription: (desc: string) => void;
  createQuizMutation: any;
  handleCreateLobby: (quizId: string) => void;
}

export function HostDashboardView({
  sessionData,
  handleSignOut,
  activeSessions,
  terminateLobbyMutation,
  quizzes,
  isQuizzesLoading,
  lobbyCode,
  handleCodeChange,
  isCodeValidating,
  isCreateModalOpen,
  setIsCreateModalOpen,
  newTitle,
  setNewTitle,
  newDescription,
  setNewDescription,
  createQuizMutation,
  handleCreateLobby,
}: HostDashboardViewProps) {
  const navigate = useNavigate();

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
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5 block">
              Host Console
            </span>
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
        <ActiveSessionsTable
          activeSessions={activeSessions ?? []}
          onTerminate={(id) => terminateLobbyMutation.mutate(id)}
          onResume={(id) =>
            navigate({
              to: '/lobby/$lobbyId',
              params: { lobbyId: id },
              search: { username: sessionData?.user.name ?? 'Host' },
            })
          }
        />

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
              <Input
                type="text"
                maxLength={4}
                placeholder="Join Code"
                value={lobbyCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-[#00f0ff] uppercase py-2 px-3 text-xs w-28 text-center font-bold"
              />
              {isCodeValidating && (
                <Loader2 size={12} className="animate-spin text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            <Button variant="spotify" size="default" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={14} /> New Quiz
            </Button>
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
              const blocks = [
                { bg: 'from-pink-500 to-rose-600' },
                { bg: 'from-purple-500 to-indigo-600' },
                { bg: 'from-cyan-500 to-blue-600' },
                { bg: 'from-amber-400 to-orange-500' },
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
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <Badge variant="default">🎵 {quiz.songCount ?? 0} {(quiz.songCount ?? 0) === 1 ? 'song' : 'songs'}</Badge>
                        <span>&bull;</span>
                        <span>📅 {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <Button
                      variant="cyan"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/studio/$quizId',
                          params: { quizId: quiz.id },
                        })
                      }
                      className="flex-1 md:flex-initial"
                    >
                      <Pencil size={12} /> Studio
                    </Button>
                    <Button
                      variant="spotify"
                      size="sm"
                      onClick={() => handleCreateLobby(quiz.id)}
                      className="flex-1 md:flex-initial"
                    >
                      <Play size={12} fill="currentColor" /> Play
                    </Button>
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
            <Button variant="spotify" onClick={() => setIsCreateModalOpen(true)}>
              Create Your First Quiz
            </Button>
          </div>
        )}
      </main>

      <CreateQuizModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewTitle('');
          setNewDescription('');
        }}
        title={newTitle}
        setTitle={setNewTitle}
        description={newDescription}
        setDescription={setNewDescription}
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          createQuizMutation.mutate({
            title: newTitle.trim(),
            description: newDescription.trim(),
          });
        }}
        isPending={createQuizMutation.isPending}
      />
    </div>
  );
}
