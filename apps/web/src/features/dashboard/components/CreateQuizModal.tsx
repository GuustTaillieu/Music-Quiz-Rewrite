import React from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog } from '#/features/shared/components/ui/dialog';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import { DASHBOARD_CONSTANTS } from '../constants/dashboardConstants';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function CreateQuizModal({
  isOpen,
  onClose,
  title,
  setTitle,
  description,
  setDescription,
  onSubmit,
  isPending,
}: CreateQuizModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <h3 className="text-lg font-black text-white mb-1">Create New Quiz</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Enter quiz details to start building your track library.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
            Quiz Title
          </label>
          <Input
            type="text"
            required
            placeholder={DASHBOARD_CONSTANTS.PLACEHOLDERS.QUIZ_TITLE}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {title.length > 0 && title.trim().length < 2 && (
            <p className="text-[10px] text-rose-400 font-bold mt-1">
              Title must be at least 2 characters long.
            </p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
            Description
          </label>
          <textarea
            placeholder={DASHBOARD_CONSTANTS.PLACEHOLDERS.QUIZ_DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/40 border border-cyan-500/20 text-white rounded-xl px-4 py-2.5 text-sm placeholder-cyan-500/10 focus:outline-none focus:border-[#00f0ff] min-h-[80px]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="spotify"
            disabled={isPending || title.trim().length < 2}
            className="flex-1 py-3"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create Quiz'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
