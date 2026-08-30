import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '#/features/shared/components/ui/avatar';
import { useAuthActions } from '..';
import { LogOut, Sparkles, ChevronDown } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../hooks/useAuth';
import { useAiProfile, GoogleAiAccountModal } from '#/features/ai-quiz';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#/features/shared/components/ui/dropdown-menu';

export function AuthBadge() {
  const { user } = useAuth();
  const { signOut } = useAuthActions();
  const { data: profile } = useAiProfile();
  const [showAiModal, setShowAiModal] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 bg-black/60 hover:bg-black/80 border border-cyan-500/20 hover:border-cyan-500/40 p-1.5 pl-2.5 rounded-2xl transition-all cursor-pointer shadow-sm group"
            >
              <Avatar className="h-7 w-7 border border-cyan-500/30">
                {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                <AvatarFallback className="text-[10px] font-black text-cyan-400 bg-cyan-500/10">
                  {user.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-start pr-1">
                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors hidden sm:inline">
                  {user.name}
                </span>
                <span className="text-[9px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                  {profile?.isGoogleLinked ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <FcGoogle size={11} /> Google (Unlimited)
                    </span>
                  ) : profile?.hasCustomKey ? (
                    <span className="text-emerald-400">Gemini: Unlimited</span>
                  ) : (
                    <span>AI Credits: {profile?.aiCredits ?? 5}</span>
                  )}
                </span>
              </div>

              <ChevronDown
                size={12}
                className="text-slate-400 group-hover:text-cyan-400 mr-1 transition-transform group-data-[state=open]:rotate-180"
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 p-2">
            {/* AI Status Item */}
            <div className="px-2.5 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/15 mb-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">AI Generation:</span>
                <span className="font-mono font-bold text-[#00f0ff]">
                  {profile?.isGoogleLinked
                    ? 'Google Unlimited'
                    : profile?.hasCustomKey
                      ? 'Custom Key'
                      : `${profile?.aiCredits ?? 5} credits`}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                {profile?.isGoogleLinked
                  ? 'Unlimited generations with your Google account'
                  : profile?.hasCustomKey
                    ? 'Unlimited generations with personal key'
                    : profile?.aiCredits === 0
                      ? 'Credits empty. Connect Google account for unlimited AI.'
                      : 'Free platform quota'}
              </p>
            </div>

            <DropdownMenuItem
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span>Google Gemini AI Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={signOut}
              className="flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer text-xs"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GoogleAiAccountModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
      />
    </>
  );
}