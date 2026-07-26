import { Dialog } from '#/features/shared/components/ui/dialog';
import { Button } from '#/features/shared/components/ui/button';

interface SyncSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  addedCount: number;
  updatedCount: number;
  preservedCount: number;
}

export function SyncSummaryModal({
  isOpen,
  onClose,
  addedCount,
  updatedCount,
  preservedCount,
}: SyncSummaryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <h3 className="text-lg font-black text-white mb-1">Quiz Sync Complete</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Updates from the original quiz creator have been synchronized into your library.
      </p>

      <div className="space-y-3 mb-6 bg-black/40 border border-cyan-500/10 p-4 rounded-xl text-xs font-semibold">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">New Songs Added:</span>
          <span className="font-mono font-bold text-emerald-400">+{addedCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Track Settings Updated:</span>
          <span className="font-mono font-bold text-cyan-400">{updatedCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Custom Edits Preserved:</span>
          <span className="font-mono font-bold text-white">{preservedCount}</span>
        </div>
      </div>

      <Button variant="cyan" size="lg" onClick={onClose} className="w-full">
        Done
      </Button>
    </Dialog>
  );
}
