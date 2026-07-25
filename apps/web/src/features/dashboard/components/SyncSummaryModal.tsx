import { RefreshCw, Plus, CheckCircle, ShieldCheck } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '#/features/shared/components/ui/dialog';
import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';

interface SyncSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncResult: { addedCount: number; updatedCount: number; preservedCount: number } | null;
  quizTitle?: string;
}

export function SyncSummaryModal({
  isOpen,
  onClose,
  syncResult,
  quizTitle,
}: SyncSummaryModalProps) {
  if (!syncResult) return null;

  const isUpToDate =
    syncResult.addedCount === 0 &&
    syncResult.updatedCount === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#00f0ff] mb-1">
          <RefreshCw size={20} className="animate-spin-slow" />
          <DialogTitle className="text-xl font-extrabold text-white">
            Upstream Sync Result
          </DialogTitle>
        </div>
        <DialogDescription>
          Synchronization report for <strong className="text-white">{quizTitle}</strong>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 my-4">
        {isUpToDate ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-emerald-300">Quiz Already Up to Date</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No new or modified tracks were found on the original parent quiz.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {syncResult.addedCount > 0 && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Plus size={14} className="text-cyan-400" /> New Tracks Added
                </div>
                <Badge variant="default">+{syncResult.addedCount}</Badge>
              </div>
            )}

            {syncResult.updatedCount > 0 && (
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
                  <RefreshCw size={14} className="text-pink-400" /> Tracks Updated
                </div>
                <Badge variant="magenta">{syncResult.updatedCount}</Badge>
              </div>
            )}
          </div>
        )}

        {syncResult.preservedCount > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <ShieldCheck size={14} className="text-amber-400" /> Custom Track Edits Preserved
            </div>
            <Badge variant="amber">{syncResult.preservedCount} preserved</Badge>
          </div>
        )}
      </div>

      <Button variant="default" size="sm" className="w-full mt-2" onClick={onClose}>
        Done
      </Button>
    </Dialog>
  );
}
