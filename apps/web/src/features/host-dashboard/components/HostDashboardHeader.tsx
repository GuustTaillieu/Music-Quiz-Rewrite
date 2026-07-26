import { Headphones } from 'lucide-react';
import { TooltipProvider } from '#/features/shared/components/ui/tooltip';
import { AuthBadge } from '#/features/auth/components/AuthBadge';

export function HostDashboardHeader() {
  return (
    <TooltipProvider>
      <header className="relative w-full border-b border-cyan-500/10 bg-black/40 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-spotify/10 border border-spotify/30 rounded-2xl text-spotify shadow-[0_0_15px_rgba(29,185,84,0.15)]">
            <Headphones size={24} />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-black leading-none text-white tracking-tight">SoundQuiz</h1>
            <p className="text-[10px] text-cyan-500/80 uppercase tracking-wider font-bold">
              Creator Studio
            </p>
          </div>
        </div>

        <AuthBadge />
      </header>
    </TooltipProvider>
  );
}
