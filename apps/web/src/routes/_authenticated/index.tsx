import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import {
  HostDashboardHeader,
  ActiveSessionsTable,
  JoinCodeInput,
  CreateQuizModal,
  QuizList,
} from '#/features/host-dashboard';
import { AiQuizGenerateModal } from '#/features/ai-quiz';
import { FloatingAudioControls } from '#/features/host-dashboard/components/FloatingAudioControls';

export const Route = createFileRoute('/_authenticated/')({
  component: HostDashboard,
});

function HostDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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

          <div className="flex flex-wrap items-center gap-3">
            <JoinCodeInput />

            <Button
              variant="spotify"
              size="sm"
              onClick={() => setIsAiModalOpen(true)}
              className="shadow-[0_0_15px_rgba(29,185,84,0.3)] font-black"
            >
              <Sparkles size={14} className="text-emerald-200 animate-pulse" /> Generate with AI
            </Button>

            <Button variant="cyan" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={14} /> Create Manual Quiz
            </Button>
          </div>
        </div>

        <QuizList
          loadingComponent={
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
              <div className="flex items-center justify-center gap-3">
                <Button variant="spotify" size="lg" onClick={() => setIsAiModalOpen(true)}>
                  <Sparkles size={16} /> Generate with AI
                </Button>
                <Button variant="cyan" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} /> Create Manual Quiz
                </Button>
              </div>
            </div>
          }
          emptyComponent={
            <div className="text-center py-20 bg-black/30 border border-cyan-500/10 rounded-2xl p-8">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00f0ff] mx-auto mb-3 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Sparkles size={24} />
              </div>
              <h3 className="font-black text-xl text-white mb-2">No Quizzes Found</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                You haven&apos;t created any Spotify music quizzes yet.
                <br />
                Generate your first quiz instantly with AI or build one manually in Studio!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="spotify"
                  size="lg"
                  onClick={() => setIsAiModalOpen(true)}
                  className="shadow-[0_0_20px_rgba(29,185,84,0.3)] font-bold"
                >
                  <Sparkles size={16} /> Generate with AI
                </Button>
                <Button variant="cyan" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} /> Create Manual Quiz
                </Button>
              </div>
            </div>
          }
        />

        <FloatingAudioControls />
      </main>

      <CreateQuizModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <AiQuizGenerateModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  );
}