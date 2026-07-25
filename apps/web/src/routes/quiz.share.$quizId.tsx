import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { GitFork, Music, ArrowLeft, Loader2 } from 'lucide-react';
import { BsSpotify } from 'react-icons/bs';
import { authClient } from '#/features/auth/api/auth-client';
import { apiFetch } from '#/features/shared/api/client';
import { dashboardService } from '#/features/dashboard/api/dashboardService';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { Card } from '#/features/shared/components/ui/card';
import type { Quiz } from '@spotify-music-quiz/shared/schema/game';

export const Route = createFileRoute('/quiz/share/$quizId')({
  component: ShareQuizRouteComponent,
});

function ShareQuizRouteComponent() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const [isForking, setIsForking] = useState(false);

  const { data: sessionData, isPending: isSessionLoading } = authClient.useSession();
  const isLoggedIn = !!sessionData?.user;

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz-share', quizId],
    queryFn: async () => {
      const { data, error } = await apiFetch<Quiz>(`/quizzes/${quizId}`);
      if (error) throw error;
      return data;
    },
  });

  const handleFork = async () => {
    if (!isLoggedIn) {
      await authClient.signIn.social({
        provider: 'spotify',
        callbackURL: window.location.href,
      });
      return;
    }

    try {
      setIsForking(true);
      const clonedQuiz = await dashboardService.forkQuiz(quizId);
      navigate({
        to: '/studio/$quizId',
        params: { quizId: clonedQuiz.id },
      });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsForking(false);
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] text-cyan-400">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#05070f] text-white p-6 text-center">
        <Music size={48} className="text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-black mb-2">Quiz Not Found</h2>
        <p className="text-xs text-muted-foreground mb-6">
          The shared quiz link may be invalid or deleted.
        </p>
        <Button variant="cyan" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none" />

      <Card className="w-full max-w-xl p-8 z-10 text-left">
        <div className="flex items-center justify-between pb-6 border-b border-cyan-500/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-pink-400">
              <GitFork size={24} />
            </div>
            <div>
              <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider block mb-0.5">
                Shared Spotify Quiz
              </span>
              <h1 className="text-2xl font-black text-white">{quiz.title}</h1>
            </div>
          </div>
          <Badge variant="spotify">{quiz.songs.length} Tracks</Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          {quiz.description || 'No description provided for this quiz.'}
        </p>

        {/* Tracks Preview list */}
        <div className="mb-8">
          <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-cyan-400">
            Included Tracks
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {quiz.songs.map((song, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-cyan-500/10"
              >
                <img
                  src={song.track.coverArtUrl}
                  alt={song.track.title}
                  className="h-9 w-9 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-white truncate">{song.track.title}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{song.track.artist}</p>
                </div>
                <Badge variant="outline" className="text-[8px]">
                  {song.questionType}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-cyan-500/10 flex items-center justify-between gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft size={14} /> Back
          </Button>

          <Button
            variant="spotify"
            size="lg"
            disabled={isForking}
            onClick={handleFork}
            className="flex-1 max-w-xs"
          >
            {isForking ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Forking Quiz...
              </>
            ) : isLoggedIn ? (
              <>
                <GitFork size={16} /> Fork to My Library
              </>
            ) : (
              <>
                <BsSpotify size={16} /> Sign in to Fork
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
