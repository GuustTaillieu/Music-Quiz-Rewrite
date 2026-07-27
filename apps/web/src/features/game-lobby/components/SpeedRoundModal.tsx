import { Dialog } from '#/features/shared/components/ui/dialog';
import { Button } from '#/features/shared/components/ui/button';
import { GameModeToggleSwitch } from './GameModeToggleSwitch';
import type { GameMode } from '@spotify-music-quiz/shared/schema/game';

interface SpeedRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
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
        Switch between Turn-Based and Speed Mode. Changes apply immediately to all active players.
      </p>

      <div className="space-y-6">
        <GameModeToggleSwitch
          selectedMode={selectedMode}
          onSelectMode={onSelectMode}
        />

        <div className="pt-2">
          <Button variant="cyan" size="lg" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
