import { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, Check, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog';
import { useAiProfile, useSetApiKeyMutation } from '../hooks/useAiQuiz';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GeminiApiKeyModal({ isOpen, onClose }: GeminiApiKeyModalProps) {
  const { data: profile, isLoading } = useAiProfile();
  const setApiKeyMutation = useSetApiKeyMutation();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput('');
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      await setApiKeyMutation.mutateAsync(apiKeyInput.trim());
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save API key');
    }
  };

  const handleRemoveKey = async () => {
    if (confirm('Are you sure you want to remove your custom Gemini API key? You will revert to using platform credits.')) {
      try {
        await setApiKeyMutation.mutateAsync(null);
        setApiKeyInput('');
      } catch (err: any) {
        alert(err.message || 'Failed to remove key');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-cyan-500/20 bg-[#070a14]/95 backdrop-blur-2xl text-white shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="text-[#00f0ff]" size={18} /> Google Gemini Key Settings
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            Connect your own Google AI Studio Gemini API key to unlock unlimited AI music quiz generations and bypass shared quota limits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-left">
          {/* Current Status Card */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-500/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Current AI Key Status
              </p>
              {isLoading ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Loader2 size={12} className="animate-spin text-cyan-400" /> Loading profile...
                </div>
              ) : profile?.hasCustomKey ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-[#00f0ff] font-bold">
                    {profile.customKeyMasked}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Active (Unlimited)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-300 font-bold">
                    Platform Key ({profile?.aiCredits ?? 0} free credits remaining)
                  </span>
                </div>
              )}
            </div>

            {profile?.hasCustomKey && (
              <Button
                type="button"
                variant="destructive_ghost"
                size="sm"
                onClick={handleRemoveKey}
                disabled={setApiKeyMutation.isPending}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                <Trash2 size={13} className="mr-1" /> Remove
              </Button>
            )}
          </div>

          {/* Key Input Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                {profile?.hasCustomKey ? 'Replace Gemini API Key' : 'Enter Your Gemini API Key'}
              </label>
              <Input
                type="password"
                required
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="font-mono text-xs py-2"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#00f0ff] hover:underline flex items-center gap-1 font-bold"
              >
                Get a free key on Google AI Studio <ExternalLink size={11} />
              </a>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-500/10">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="cyan"
                size="sm"
                disabled={setApiKeyMutation.isPending || !apiKeyInput.trim()}
              >
                {setApiKeyMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1" /> Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <Check size={12} className="text-emerald-400 mr-1" /> Key Saved!
                  </>
                ) : (
                  <>
                    <KeyRound size={12} className="mr-1" /> Save Key
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
