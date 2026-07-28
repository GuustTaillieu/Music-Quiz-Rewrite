import { Headphones, Copy, Check, LogOut } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '#/features/shared/components/ui/tooltip';
import { GameModeToggleSwitch } from '#/features/game-lobby';
import { useCopyLobbyCode } from '#/features/lobby-core/hooks/useCopyLobyCode';
import { useQuizGame } from '#/features/game-player';

interface HostHeaderBarProps {
  quizTitle?: string;
  currentSongIndex: number;
  totalSongs: number;
  onLeave: () => void;
}

export function HostHeaderBar({
  quizTitle,
  currentSongIndex,
  totalSongs,
  onLeave,
}: HostHeaderBarProps) {
  const { gameState, selectGameMode } = useQuizGame()
  const { formattedLobbyId, handleCopyCode, isCopied } = useCopyLobbyCode();

  if (!gameState) return null;

  return (
    <TooltipProvider>
      <header className="relative w-full border-b border-cyan-500/10 bg-black/40 backdrop-blur-md z-10 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-spotify/10 border border-spotify/30 rounded-xl text-spotify">
            <Headphones size={20} />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-none text-white tracking-tight">
              {quizTitle || 'SoundQuiz Game Session'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="font-mono">CODE: {formattedLobbyId}</Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="text-[10px] text-muted-foreground hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer h-auto py-0.5 px-1"
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
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Lobby Code</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <GameModeToggleSwitch
          selectedMode={gameState.gameMode}
          onSelectMode={selectGameMode}
        />

        <div className="flex items-center gap-3">
          <Badge variant="spotify">
            Track {currentSongIndex + 1} / {totalSongs}
          </Badge>
          <Button variant="destructive" size="sm" onClick={onLeave}>
            <LogOut size={12} /> Leave
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
}
