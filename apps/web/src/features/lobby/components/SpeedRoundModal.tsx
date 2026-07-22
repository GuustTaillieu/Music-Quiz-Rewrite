import { Dialog } from '#/features/shared/components/ui/dialog';
import { Button } from '#/features/shared/components/ui/button';
import { LOBBY_CONSTANTS } from '../constants/lobbyConstants';

interface SpeedRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: string;
  onSelectMode: (modeId: string) => void;
}

export function SpeedRoundModal({
  isOpen,
  onClose,
  selectedMode,
  onSelectMode,
}: SpeedRoundModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <h3 className="text-lg font-black text-white mb-1">Game Mode Settings</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Choose how players participate during trivia rounds.
      </p>

      <div className="space-y-3 mb-6">
        {LOBBY_CONSTANTS.GAME_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan-500/20 border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'bg-black/40 border-cyan-500/10 text-muted-foreground hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{mode.icon}</span>
                <span className="font-bold text-xs">{mode.label}</span>
              </div>
              {isSelected && <span className="text-[10px] font-black text-[#00f0ff] uppercase">Active</span>}
            </div>
          );
        })}
      </div>

      <Button variant="default" size="lg" className="w-full" onClick={onClose}>
        Done
      </Button>
    </Dialog>
  );
}
