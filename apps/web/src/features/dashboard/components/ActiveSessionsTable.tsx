import { Button } from '#/features/shared/components/ui/button';
import { Badge } from '#/features/shared/components/ui/badge';
import type { ActiveSession } from '../api/dashboardService';

interface ActiveSessionsTableProps {
  activeSessions: ActiveSession[];
  onTerminate: (lobbyId: string) => void;
  onResume: (lobbyId: string) => void;
}

export function ActiveSessionsTable({
  activeSessions,
  onTerminate,
  onResume,
}: ActiveSessionsTableProps) {
  if (activeSessions.length === 0) return null;

  const currentSession = activeSessions[0];

  return (
    <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-amber-500 uppercase tracking-wider leading-none">
              Active Quiz Running
            </h4>
            <Badge variant="amber">{currentSession.lobbyId}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentSession.quizTitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (
              confirm(
                'Are you sure you want to stop this game fully? This will disconnect all players.',
              )
            ) {
              onTerminate(currentSession.lobbyId);
            }
          }}
          className="flex-1 sm:flex-initial"
        >
          Stop Game Fully
        </Button>
        <Button
          variant="amber"
          size="sm"
          onClick={() => onResume(currentSession.lobbyId)}
          className="flex-1 sm:flex-initial"
        >
          Resume Game
        </Button>
      </div>
    </div>
  );
}
