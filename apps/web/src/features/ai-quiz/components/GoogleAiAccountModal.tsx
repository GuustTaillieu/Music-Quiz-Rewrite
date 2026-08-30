import { useState } from 'react';
import { Sparkles, Loader2, Check, ExternalLink, KeyRound, Trash2, Unlink } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '#/features/shared/components/ui/button';
import { Input } from '#/features/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/features/shared/components/ui/dialog';
import { authClient } from '#/features/auth/api/auth-client';
import {
  useAiProfile,
  useUnlinkGoogleAccountMutation,
  useSetApiKeyMutation,
} from '../hooks/useAiQuiz';

interface GoogleAiAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleAiAccountModal({ isOpen, onClose }: GoogleAiAccountModalProps) {
  const { data: profile, isLoading } = useAiProfile();
  const unlinkGoogleMutation = useUnlinkGoogleAccountMutation();
  const setApiKeyMutation = useSetApiKeyMutation();

  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [showManualKeySection, setShowManualKeySection] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  const handleConnectGoogle = async () => {
    try {
      setIsConnectingGoogle(true);
      const res = await authClient.linkSocial({
        provider: 'google',
        callbackURL: window.location.href,
      });
      if (res?.error) {
        if (res.error.code === 'PROVIDER_NOT_FOUND' || res.error.status === 404) {
          alert(
            'Google OAuth credentials (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET) are not configured in your backend .env file.\n\nPlease add them in apps/backend/.env.local or enter a Gemini API Key below.',
          );
          setShowManualKeySection(true);
        } else {
          alert(res.error.message || 'Failed to connect Google account');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('NOT_FOUND')) {
        alert(
          'Google OAuth credentials (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET) are not configured in your backend .env file.\n\nPlease add them in apps/backend/.env.local or enter a Gemini API Key below.',
        );
        setShowManualKeySection(true);
      } else {
        alert(err.message || 'Failed to connect Google account');
      }
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (confirm('Disconnect your Google account? You will revert to using platform credits.')) {
      try {
        await unlinkGoogleMutation.mutateAsync();
      } catch (err: any) {
        alert(err.message || 'Failed to disconnect Google account');
      }
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    try {
      await setApiKeyMutation.mutateAsync(apiKeyInput.trim());
      setIsKeySaved(true);
      setTimeout(() => {
        setIsKeySaved(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save API key');
    }
  };

  const handleRemoveApiKey = async () => {
    if (confirm('Remove custom Gemini API key?')) {
      try {
        await setApiKeyMutation.mutateAsync(null);
        setApiKeyInput('');
      } catch (err: any) {
        alert(err.message || 'Failed to remove API key');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-cyan-500/20 bg-[#070a14]/95 backdrop-blur-2xl text-white shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="text-[#00f0ff]" size={18} /> Google Gemini AI Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            Connect your Google account to unlock unlimited AI music quiz generations with Gemini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-left">
          {/* Current AI Status Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
              Current AI Status
            </p>

            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 size={14} className="animate-spin text-cyan-400" /> Checking status...
              </div>
            ) : profile?.isGoogleLinked ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-md">
                    <FcGoogle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">Google Account Linked</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black border border-emerald-500/30">
                        Unlimited
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Full Gemini AI access enabled
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive_ghost"
                  size="sm"
                  onClick={handleUnlinkGoogle}
                  disabled={unlinkGoogleMutation.isPending}
                  className="text-xs text-rose-400 hover:text-rose-300 gap-1 cursor-pointer"
                >
                  <Unlink size={13} /> Disconnect
                </Button>
              </div>
            ) : profile?.hasCustomKey ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#00f0ff] font-bold">
                      {profile.customKeyMasked}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      API Key
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Custom Gemini API key active
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive_ghost"
                  size="sm"
                  onClick={handleRemoveApiKey}
                  disabled={setApiKeyMutation.isPending}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  <Trash2 size={13} className="mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Platform Free Tier
                  </p>
                  <p className="text-[11px] text-cyan-400 font-semibold mt-0.5">
                    {profile?.aiCredits ?? 0} free generations remaining
                  </p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                  Standard
                </span>
              </div>
            )}
          </div>

          {/* Connect Google Button */}
          {!profile?.isGoogleLinked && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 border-none font-bold text-xs py-3 flex items-center justify-center gap-2.5 shadow-lg shadow-white/5 cursor-pointer"
              >
                {isConnectingGoogle ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-900" /> Connecting to Google...
                  </>
                ) : (
                  <>
                    <FcGoogle size={18} /> Sign in with Google for Unlimited AI
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowManualKeySection((prev) => !prev)}
                  className="text-[11px] text-muted-foreground hover:text-cyan-400 transition-colors font-medium underline"
                >
                  {showManualKeySection ? 'Hide API key options' : 'Or connect via Gemini API Key'}
                </button>
              </div>
            </div>
          )}

          {/* Manual API Key Fallback */}
          {showManualKeySection && !profile?.isGoogleLinked && (
            <form onSubmit={handleSaveApiKey} className="pt-2 border-t border-cyan-500/10 space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5">
                  Gemini API Key
                </label>
                <Input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="font-mono text-xs py-2"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00f0ff] hover:underline flex items-center gap-1 font-bold"
                >
                  Get key on Google AI Studio <ExternalLink size={10} />
                </a>

                <Button
                  type="submit"
                  variant="cyan"
                  size="sm"
                  disabled={setApiKeyMutation.isPending || !apiKeyInput.trim()}
                  className="text-xs"
                >
                  {setApiKeyMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : isKeySaved ? (
                    <>
                      <Check size={12} className="text-emerald-400 mr-1" /> Saved!
                    </>
                  ) : (
                    <>
                      <KeyRound size={12} className="mr-1" /> Save Key
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="flex justify-end pt-3 border-t border-cyan-500/10">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
