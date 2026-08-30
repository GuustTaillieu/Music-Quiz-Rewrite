import { AlertTriangle, KeyRound, ExternalLink } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog';

interface AiQuotaExceededDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKeySettings: () => void;
  isCustomKey?: boolean;
  message?: string;
}

export function AiQuotaExceededDialog({
  isOpen,
  onClose,
  onOpenKeySettings,
  isCustomKey = false,
  message,
}: AiQuotaExceededDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-amber-500/30 bg-[#070a14]/95 backdrop-blur-2xl text-white shadow-[0_0_50px_rgba(245,158,11,0.15)]">
        <DialogHeader className="text-left">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <AlertTriangle size={22} />
          </div>
          <DialogTitle className="text-lg font-black text-white">
            {isCustomKey ? 'Gemini API Quota Reached' : 'AI Generation Limit Reached'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            {message ||
              (isCustomKey
                ? 'Your personal Google Gemini API key has temporarily exceeded its request quota. You can view your usage or upgrade in Google AI Studio.'
                : 'You have used all your free platform credits. Connect your own free Google Gemini API key to enjoy unlimited AI quiz generations.')}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 bg-black/40 border border-amber-500/20 rounded-xl space-y-2 text-xs">
          <p className="text-amber-200 font-semibold text-[11px]">💡 How to get unlimited free AI quizzes:</p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground">
            <li>Visit Google AI Studio to generate a free Gemini API key.</li>
            <li>Paste your key into your Quiz Settings.</li>
            <li>Generate quizzes without platform limits!</li>
          </ol>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-cyan-500/10">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            Get Free Gemini Key <ExternalLink size={12} />
          </a>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              variant="spotify"
              size="sm"
              onClick={() => {
                onClose();
                onOpenKeySettings();
              }}
              className="flex items-center gap-1.5"
            >
              <KeyRound size={13} /> {isCustomKey ? 'Change API Key' : 'Connect Key'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
