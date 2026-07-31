import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { HostDashboardHeader, ActiveSessionsTable, JoinCodeInput, CreateQuizModal, QuizList } from '#/features/host-dashboard';
import { FloatingAudioControls } from '#/features/host-dashboard/components/FloatingAudioControls';

export const Route = createFileRoute('/_authenticated/')({
  component: HostDashboard,
});

function HostDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#05070f] text-white">
      <div className="synth-grid absolute inset-0 pointer-events-none opacity-40" />

      <HostDashboardHeader />

      <main className="w-full max-w-6xl mx-auto px-6 py-8 z-10 flex-1 flex flex-col justify-start">
        <ActiveSessionsTable />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-cyan-500/10">
          <div className="text-left">
            <h2 className="text-xl font-black tracking-tight text-white">My Quiz Catalog</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select or create a Spotify quiz to start host lobbies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <JoinCodeInput />
            <Button variant="cyan" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={14} /> Create Quiz
            </Button>
          </div>
        </div>

        <QuizList loadingComponent={
          <div className="flex items-center justify-center py-20 text-cyan-400 font-bold gap-2">
            <Loader2 className="animate-spin" size={24} /> Loading Quiz Catalog...
          </div>
        }
          errorComponent={
            <div className="text-center py-20 bg-black/30 border border-cyan-500/10 rounded-2xl p-8">
              <h3 className="font-black text-xl text-white mb-2">Error Loading Quizzes</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                Failed to load your quiz catalog. Please try again later.
              </p>
              <Button variant="cyan" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} /> Create Your First Quiz
              </Button>
            </div>
          }
          emptyComponent={
            <div className="text-center py-20 bg-black/30 border border-cyan-500/10 rounded-2xl p-8">
              <h3 className="font-black text-xl text-white mb-2">No Quizzes Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                You haven&apos;t created any Spotify music quizzes yet.
                <br />
                Click the button below to create your first quiz.
              </p>
              <Button variant="cyan" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} /> Create Your First Quiz
              </Button>
            </div>
          }
        />

        <FloatingAudioControls />
      </main>

      <CreateQuizModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}