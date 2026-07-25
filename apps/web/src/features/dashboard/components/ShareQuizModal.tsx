import { useState } from 'react';
import { Share2, Copy, Check, Sparkles } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '#/features/shared/components/ui/dialog';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';

interface ShareQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string | null;
  quizTitle: string | null;
}

export function ShareQuizModal({
  isOpen,
  onClose,
  quizId,
  quizTitle,
}: ShareQuizModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!quizId) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz/share/${quizId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#00f0ff] mb-1">
          <Share2 size={20} />
          <DialogTitle className="text-xl font-extrabold text-white">
            Share Quiz
          </DialogTitle>
        </div>
        <DialogDescription>
          Anyone with this link can view and fork <strong className="text-white">{quizTitle}</strong> into their library.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-4">
        <div className="flex items-center gap-2 bg-black/60 border border-cyan-500/20 p-2.5 rounded-xl">
          <Input
            type="text"
            readOnly
            value={shareUrl}
            className="py-1 text-xs font-mono bg-transparent border-0 focus:ring-0 select-all"
          />
          <Button variant={isCopied ? 'spotify' : 'cyan'} size="sm" onClick={handleCopy} className="shrink-0">
            {isCopied ? (
              <>
                <Check size={14} /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy
              </>
            )}
          </Button>
        </div>

        <div className="p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl text-[11px] text-muted-foreground flex items-start gap-2">
          <Sparkles size={14} className="text-[#00f0ff] shrink-0 mt-0.5" />
          <span>
            Forked quizzes sync new tracks added by you, while preserving custom track edits made by the recipient.
          </span>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full mt-2" onClick={onClose}>
        Done
      </Button>
    </Dialog>
  );
}
