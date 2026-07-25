import { LogOut } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '#/features/shared/components/ui/tooltip';

interface PlayerLeaveButtonProps {
  onLeave: () => void;
}

export function PlayerLeaveButton({ onLeave }: PlayerLeaveButtonProps) {
  return (
    <div className="z-30">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onLeave}
            variant="destructive_ghost"
            size="sm"
            className="h-8 px-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-md text-xs font-bold gap-1.5"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Exit Lobby</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Leave Game Lobby</TooltipContent>
      </Tooltip>
    </div>
  );
}
