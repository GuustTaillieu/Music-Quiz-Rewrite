import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/features/shared/components/ui/dialog';
import { useCreateQuizMutation } from '#/features/quiz-core';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateQuizModal({ isOpen, onClose }: CreateQuizModalProps) {
  const navigate = useNavigate();
  const createQuizMutation = useCreateQuizMutation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return;

    try {
      const quiz = await createQuizMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
      navigate({
        to: '/studio/$quizId',
        params: { quizId: quiz.id },
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create quiz');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-cyan-500/20 bg-[#05070f]/95 backdrop-blur-2xl text-white">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Plus size={20} className="text-[#00f0ff]" /> Create New Quiz
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Set a title and description for your new Spotify music quiz catalog.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-left">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
              Quiz Title *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. 90s Pop Nostalgia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="py-2 text-xs"
              autoFocus
            />
            {title.length > 0 && title.trim().length < 2 && (
              <p className="text-[10px] text-rose-400 font-bold mt-1">
                Title must be at least 2 characters long.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="Brief description of track categories..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-black/40 border border-cyan-500/20 px-3 py-2 text-xs text-white placeholder-cyan-500/30 focus:border-[#00f0ff] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="cyan"
              size="sm"
              disabled={createQuizMutation.isPending || title.trim().length < 2}
            >
              {createQuizMutation.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Creating...
                </>
              ) : (
                'Create & Open Studio'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
