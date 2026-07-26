import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Dialog } from '#/features/shared/components/ui/dialog';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';

interface ShareQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
}

export function ShareQuizModal({ isOpen, onClose, quizId, quizTitle }: ShareQuizModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/quiz/share/${quizId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <h3 className="text-lg font-black text-white mb-1">Share Quiz</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Share <span className="text-cyan-400 font-bold">"{quizTitle}"</span> with other hosts to let them view and fork this track library.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
            Shareable Link
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              readOnly
              value={shareUrl}
              className="py-2 px-3 text-xs font-mono font-bold select-all flex-1"
            />
            <Button
              variant={copied ? 'emerald' : 'cyan'}
              size="default"
              onClick={handleCopy}
              className="gap-1.5 shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
