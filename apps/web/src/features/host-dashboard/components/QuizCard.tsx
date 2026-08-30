import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Play, Edit3, Trash2, GitFork } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Card } from '#/features/shared/components/ui/card';
import { Badge } from '#/features/shared/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/features/shared/components/ui/tooltip';
import { useAuth } from '#/features/auth';
import { type QuizMeta, useDeleteQuizMutation } from '#/features/quiz-core';
import { useCreateLobbyMutation } from '#/features/lobby-core';

interface QuizCardProps {
  quiz: QuizMeta;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const deleteQuizMutation = useDeleteQuizMutation();
  const createLobbyMutation = useCreateLobbyMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartLobby = async () => {
    try {
      const res = await createLobbyMutation.mutateAsync(quiz.id);
      navigate({
        to: '/lobby/$lobbyId',
        params: { lobbyId: res.lobbyId },
        search: { username: user.name },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create lobby');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
      try {
        setIsDeleting(true);
        await deleteQuizMutation.mutateAsync(quiz.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete quiz');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <TooltipProvider>
      <Card className="p-6 bg-black/40 border border-cyan-500/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between text-left group">
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-extrabold text-base text-white tracking-tight leading-snug truncate group-hover:text-[#00f0ff] transition-colors">
              {quiz.title}
            </h3>
            <Badge variant="spotify" className="shrink-0 font-mono">
              {quiz.songCount ?? 0} Tracks
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
            {quiz.description || 'No description provided.'}
          </p>

          {quiz.isAiGenerated && (
            <div className="mb-3">
              <Badge variant="default" className="text-[9px] font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                ✨ AI Generated
              </Badge>
            </div>
          )}

          {quiz.forkedFrom && (
            <div className="mb-4">
              <Badge variant="magenta" className="text-[9px]">
                <GitFork size={10} className="mr-1" /> Forked from @{quiz.forkedFrom.creatorName}
              </Badge>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-cyan-500/10 flex items-center justify-between gap-2">
          <Button
            variant="cyan"
            size="sm"
            onClick={handleStartLobby}
            disabled={createLobbyMutation.isPending}
            className="flex-1"
          >
            <Play size={12} fill="currentColor" /> Play Game
          </Button>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    navigate({
                      to: '/studio/$quizId',
                      params: { quizId: quiz.id },
                    })
                  }
                  className="h-8 w-8 cursor-pointer"
                >
                  <Edit3 size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Quiz</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive_ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-8 w-8 cursor-pointer"
                >
                  <Trash2 size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Quiz</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
