import { createFileRoute } from '@tanstack/react-router';
import { Plus, Trash2, Edit, ArrowLeft, Disc, Music } from 'lucide-react';
import { useStudioIndex } from '#/hooks/useStudioIndex';

export const Route = createFileRoute('/studio/')({
  component: StudioIndex,
});

function StudioIndex() {
  const {
    navigate,
    sessionData,
    isSessionLoading,
    quizzes,
    isQuizzesLoading,
    deleteMutation,
    isCreateModalOpen,
    setIsCreateModalOpen,
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    createQuizMutation,
  } = useStudioIndex();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createQuizMutation.mutate({
      title: newTitle,
      description: newDescription,
    });
  };

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
          onClick={() => setIsCreateModalOpen(true)}
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
                  {quiz.createdAt
                    ? new Date(quiz.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recently created'}
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
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-lagoon hover:bg-lagoon-deep text-white font-bold py-2.5 px-6 rounded-xl"
          >
            Create Quiz
          </button>
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="island-shell p-8 rounded-3xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h2 className="display-title text-2xl font-bold text-foreground mb-2">
              Create New Quiz
            </h2>
            <p className="text-muted-foreground text-xs mb-6">
              Give your new music quiz a title and description before heading to the editor.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Quiz Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2000s Pop Classics"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-foreground bg-foam/5 border border-line rounded-xl px-4 py-2.5 outline-none focus:border-lagoon/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="e.g. Guess the artist and track name from these nostalgic throwbacks!"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full text-foreground bg-foam/5 border border-line rounded-xl px-4 py-2.5 outline-none focus:border-lagoon/60 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewTitle('');
                    setNewDescription('');
                  }}
                  className="flex-1 bg-foam/10 hover:bg-foam/20 text-foreground font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || createQuizMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  {createQuizMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
