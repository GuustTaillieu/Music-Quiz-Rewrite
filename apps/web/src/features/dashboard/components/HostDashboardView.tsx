import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Headphones, LogOut, Loader2, Plus, Music, Pencil, Play, Share2, RefreshCw, MoreVertical, Trash2, GitFork, Calendar1 } from 'lucide-react';
import { BsMusicNote, BsMusicNoteList } from 'react-icons/bs';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Badge } from '#/features/shared/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '#/features/shared/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/features/shared/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/features/shared/components/ui/dropdown-menu';
import { ActiveSessionsTable } from './ActiveSessionsTable';
import { CreateQuizModal } from './CreateQuizModal';
import { ShareQuizModal } from './ShareQuizModal';
import { SyncSummaryModal } from './SyncSummaryModal';
import { dashboardService, type QuizMeta, type ActiveSession } from '../api/dashboardService';
import { Card } from '#/features/shared/components/ui/card';
import { authClient } from '#/features/auth/api/auth-client';

interface HostDashboardViewProps {
  sessionData: any;
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
  refetchQuizzes?: () => void;
}

export function HostDashboardView({
  sessionData,
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
  refetchQuizzes,
}: HostDashboardViewProps) {
  const navigate = useNavigate();
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ result: any; title: string } | null>(null);
  const [syncingQuizId, setSyncingQuizId] = useState<string | null>(null);

  const handleSync = async (quiz: QuizMeta) => {
    try {
      setSyncingQuizId(quiz.id);
      const res = await dashboardService.syncQuiz(quiz.id);
      setSyncResult({ result: res, title: quiz.title });
      if (refetchQuizzes) refetchQuizzes();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSyncingQuizId(null);
    }
  };

  const handleDelete = async (quiz: QuizMeta) => {
    if (confirm(`Are you sure you want to delete quiz "${quiz.title}"?`)) {
      try {
        await dashboardService.deleteQuiz(quiz.id);
        if (refetchQuizzes) refetchQuizzes();
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const handleSignOut = async () => {
    console.log("Signout called")
    await authClient.signOut();
    window.location.reload();
  };

  return (
    <TooltipProvider>
      <div className="relative w-full min-h-screen pb-16 flex flex-col bg-[#05070f] text-white">
        {/* Synthwave static grid backdrop */}
        <div className="synth-grid absolute inset-0 pointer-events-none opacity-40" />

        {/* Top Premium Navbar */}
        <header className="relative w-full border-b border-cyan-500/10 bg-black/40 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-spotify/10 border border-spotify/30 rounded-xl text-spotify">
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
                <Avatar className="h-7 w-7 border-cyan-500/20">
                  {sessionData.user.image ? (
                    <AvatarImage src={sessionData.user.image} alt={sessionData.user.name} />
                  ) : null}
                  <AvatarFallback className="text-[10px] font-black text-cyan-400 bg-cyan-500/10">
                    {sessionData.user.name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-muted-foreground pr-1 hidden sm:inline">
                  {sessionData.user.name}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild onClick={handleSignOut}>
                  <Button
                    variant="destructive_ghost"
                    size="icon"
                    className="text-muted-foreground"
                  >
                    <LogOut size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign Out</TooltipContent>
              </Tooltip>
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
                Create, fork, and manage your Spotify music quiz libraries.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Guest Join Entry */}
              <div className="relative">
                <Input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Join Code"
                  value={lobbyCode}
                  onChange={(e) => handleCodeChange(e.target.value.replace(/\D/g, ''))}
                  className="py-1.5 px-3 text-xs w-36 font-mono font-bold"
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
                  <Card
                    key={quiz.id}
                    className="border border-cyan-500/10 hover:border-cyan-500/25 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                  >
                    {/* Info Block */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`h-12 w-12 rounded-xl bg-linear-to-br ${blockColor.bg} flex items-center justify-center font-bold text-lg shadow-md shrink-0`}>
                        <BsMusicNoteList size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-white text-base leading-tight truncate">
                            {quiz.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {quiz.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-3">
                          <Badge variant="default" className='text-[8px] py-0 px-2'>
                            <BsMusicNote size={8} className='mr-1' />
                            {quiz.songCount ?? 0} {(quiz.songCount ?? 0) === 1 ? 'song' : 'songs'}
                          </Badge>
                          <Badge variant="amber" className='text-[8px] py-0 px-2'>
                            <Calendar1 size={8} className='mr-1' />
                            {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'}
                          </Badge>
                          {quiz.forkedFrom && (
                            <Badge variant="magenta" className="text-[8px] py-0 px-2">
                              <GitFork size={8} className='mr-1' />
                              from @{quiz.forkedFrom.creatorName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Block */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button variant="cyan"
                        size="sm"
                        onClick={() =>
                          navigate({
                            to: '/studio/$quizId',
                            params: { quizId: quiz.id },
                          })
                        }
                      >
                        <Pencil size={12} /> Studio
                      </Button>
                      <Button
                        variant="spotify"
                        size="sm"
                        onClick={() => handleCreateLobby(quiz.id)}
                      >
                        <Play size={12} fill="currentColor" /> Play
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShareTarget({ id: quiz.id, title: quiz.title })}>
                            <Share2 size={12} className="mr-2 text-cyan-400" /> Share Quiz
                          </DropdownMenuItem>
                          {quiz.forkedFromQuizId && (
                            <DropdownMenuItem onClick={() => handleSync(quiz)} disabled={syncingQuizId === quiz.id}>
                              <RefreshCw size={12} className={`mr-2 text-amber-400 ${syncingQuizId === quiz.id ? 'animate-spin' : ''}`} /> Sync Upstream
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(quiz)} className="text-rose-400 hover:text-rose-300">
                            <Trash2 size={12} className="mr-2 text-rose-400" /> Delete Quiz
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="relative w-full rounded-3xl border border-cyan-500/20 bg-linear-to-b from-[#0b0e17]/90 to-[#05070f]/95 p-10 sm:p-14 text-center shadow-[0_0_50px_rgba(0,240,255,0.06)] overflow-hidden">
              {/* Subtle ambient glowing orb */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-5 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  <Music size={32} className="animate-pulse" />
                </div>
                <h3 className="font-extrabold text-white text-xl tracking-tight mb-2">No Quizzes Created Yet</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mb-8">
                  Create a custom Spotify quiz library or fork an existing community quiz to host live trivia rounds.
                </p>
                <Button variant="spotify" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} /> Create Your First Quiz
                </Button>
              </div>
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

        <ShareQuizModal
          isOpen={Boolean(shareTarget)}
          onClose={() => setShareTarget(null)}
          quizId={shareTarget?.id ?? null}
          quizTitle={shareTarget?.title ?? null}
        />

        <SyncSummaryModal
          isOpen={Boolean(syncResult)}
          onClose={() => setSyncResult(null)}
          syncResult={syncResult?.result ?? null}
          quizTitle={syncResult?.title}
        />
      </div>
    </TooltipProvider>
  );
}
