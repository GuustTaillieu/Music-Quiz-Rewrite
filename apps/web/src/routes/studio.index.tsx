import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '#/lib/auth-client';
import { Plus, Trash2, Edit, ArrowLeft, Disc, Music } from 'lucide-react';

export const Route = createFileRoute('/studio/')({
  component: StudioIndex,
});

// Helper for generating UUID client-side if crypto.randomUUID isn't available
function getUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback simple generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function StudioIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessionData, isPending: isSessionLoading } =
    authClient.useSession();

  // Fetch quizzes using TanStack Query
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes');
      if (!res.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      return res.json() as Promise<
        Array<{
          id: string;
          title: string;
          description: string | null;
          createdAt: string;
        }>
      >;
    },
    enabled: !!sessionData?.user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete quiz');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });

  const handleCreateNewQuiz = () => {
    const newId = getUUID();
    navigate({
      to: '/studio/$quizId',
      params: { quizId: newId },
    });
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!sessionData?.user) {
    return (
      <div className="page-wrap min-h-screen py-12 flex flex-col items-center justify-center">
        <div className="island-shell p-8 rounded-3xl text-center max-w-md w-full">
          <Disc size={48} className="mx-auto text-amber-500 mb-4 animate-spin" />
          <h2 className="display-title text-2xl font-bold text-foreground mb-4">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            You must be signed in with a Spotify Premium account to access the Quiz Studio.
          </p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-3 px-6 rounded-xl"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap min-h-screen py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/' })}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foam/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="display-title text-3xl font-black text-foreground">
              Quiz Studio
            </h1>
            <p className="text-xs text-muted-foreground">
              Create and edit customized music quizzes
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateNewQuiz}
          className="bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-2.5 px-5 rounded-xl hover:shadow-lg active:scale-98 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} /> New Quiz
        </button>
      </div>

      {/* Grid List */}
      {isQuizzesLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : quizzes && quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="island-shell p-6 rounded-2xl flex flex-col justify-between hover:border-lagoon/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-bold text-foreground text-lg leading-tight truncate">
                    {quiz.title}
                  </h3>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() =>
                        navigate({
                          to: '/studio/$quizId',
                          params: { quizId: quiz.id },
                        })
                      }
                      className="p-1.5 text-muted-foreground hover:text-lagoon-deep rounded-lg hover:bg-foam/15"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this quiz?')) {
                          deleteMutation.mutate(quiz.id);
                        }
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2 min-h-10 mb-4">
                  {quiz.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-line">
                <span className="flex items-center gap-1">
                  <Music size={12} /> Quiz Songs
                </span>
                <span>
                  {new Date(quiz.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-line rounded-3xl bg-foam/10">
          <Disc size={64} className="mx-auto text-muted-foreground mb-4 opacity-40 animate-pulse" />
          <h3 className="font-bold text-foreground text-lg mb-2">
            No Quizzes Found
          </h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Get started by creating your very first music quiz. You can search Spotify tracks and select specific play offsets.
          </p>
          <button
            onClick={handleCreateNewQuiz}
            className="bg-lagoon hover:bg-lagoon-deep text-white font-bold py-2.5 px-6 rounded-xl"
          >
            Create Quiz
          </button>
        </div>
      )}
    </div>
  );
}
