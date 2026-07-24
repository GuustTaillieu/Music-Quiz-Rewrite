import { Headphones, Sparkles, Copy, Check, LogOut } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/features/shared/components/ui/tooltip';

interface HostHeaderBarProps {
  quizTitle?: string;
  lobbyId: string;
  currentSongIndex: number;
  totalSongs: number;
  isCopied?: boolean;
  handleCopyCode: () => void;
  onOpenSpeedModal: () => void;
  onLeave: () => void;
}

export function HostHeaderBar({
  quizTitle,
  lobbyId,
  currentSongIndex,
  totalSongs,
  isCopied,
  handleCopyCode,
  onOpenSpeedModal,
  onLeave,
}: HostHeaderBarProps) {
  return (
    <TooltipProvider>
      <header className="relative w-full border-b border-cyan-500/10 bg-black/40 backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl text-[#1DB954]">
            <Headphones size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-none text-white tracking-tight">
              {quizTitle || 'SoundQuiz Game Session'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">CODE: {lobbyId}</Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyCode}
                    className="text-[10px] text-muted-foreground hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check size={10} className="text-emerald-400" /> <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} /> Copy
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Copy Lobby Code</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

      <div className="flex items-center gap-3">
        <Badge variant="spotify">
          Track {currentSongIndex + 1} / {totalSongs}
        </Badge>
        <Button variant="magenta" size="sm" onClick={onOpenSpeedModal}>
          <Sparkles size={12} /> Speed Mode
        </Button>
        <Button variant="destructive" size="sm" onClick={onLeave}>
          <LogOut size={12} /> Leave
        </Button>
      </div>
    </header>
  </TooltipProvider>
  );
}
