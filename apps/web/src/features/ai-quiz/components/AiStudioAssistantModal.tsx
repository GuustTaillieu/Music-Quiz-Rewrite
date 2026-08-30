import { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog';
import { useSuggestTracksMutation, useAiProfile } from '../hooks/useAiQuiz';
import { AiQuotaExceededDialog } from './AiQuotaExceededDialog';
import { GeminiApiKeyModal } from './GeminiApiKeyModal';
import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';

interface AiStudioAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  onAddSongs: (songs: QuizSong[]) => void;
}

export function AiStudioAssistantModal({
  isOpen,
  onClose,
  quizId,
  onAddSongs,
}: AiStudioAssistantModalProps) {
  const { data: profile } = useAiProfile();
  const suggestMutation = useSuggestTracksMutation();
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(3);

  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const newSongs = await suggestMutation.mutateAsync({
        quizId,
        prompt: prompt.trim(),
        count,
      });

      if (newSongs.length === 0) {
        alert('No matching songs found. Please try a different prompt.');
        return;
      }

      onAddSongs(newSongs);
      onClose();
    } catch (err: any) {
      if (
        err.code === 'QUOTA_EXCEEDED' ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.status === 429 ||
        err.message?.toLowerCase().includes('quota')
      ) {
        setQuotaErrorMessage(err.message);
        setShowQuotaDialog(true);
      } else {
        alert(err.message || 'Failed to suggest songs');
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md border-cyan-500/20 bg-[#05070f]/95 backdrop-blur-2xl text-white shadow-[0_0_50px_rgba(0,240,255,0.15)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-white">
              <Sparkles size={18} className="text-[#00f0ff]" />
              Add Songs with AI
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Ask Gemini AI to suggest and append complementary tracks that fit your quiz vibe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-left">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                What kind of songs should AI add? *
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Add 3 similar high-energy rock anthems from the same era"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-cyan-500/20 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00f0ff] focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                Number of Songs to Add
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCount(c)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      count === c
                        ? 'bg-cyan-500/20 border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'bg-black/40 border-cyan-500/10 text-muted-foreground hover:border-cyan-500/30'
                    }`}
                  >
                    +{c} Songs
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-500/10">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="cyan"
                size="sm"
                disabled={suggestMutation.isPending || !prompt.trim()}
              >
                {suggestMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1.5" /> Suggesting...
                  </>
                ) : (
                  <>
                    <Plus size={13} className="mr-1" /> Add Songs
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AiQuotaExceededDialog
        isOpen={showQuotaDialog}
        onClose={() => setShowQuotaDialog(false)}
        onOpenKeySettings={() => setShowKeyModal(true)}
        isCustomKey={profile?.hasCustomKey}
        message={quotaErrorMessage}
      />

      <GeminiApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </>
  );
}
