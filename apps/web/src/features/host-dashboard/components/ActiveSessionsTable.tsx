import { useNavigate } from '@tanstack/react-router';
import { Play, LogOut, Radio } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { Card } from '#/features/shared/components/ui/card';
import { Badge } from '#/features/shared/components/ui/badge';
import { useAuth } from '#/features/auth/hooks/useAuth';
import { useActiveLobbiesQuery, useTerminateLobbyMutation } from '#/features/lobby-core';

export function ActiveSessionsTable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: activeSessions = [], isLoading } = useActiveLobbiesQuery();
  const terminateLobbyMutation = useTerminateLobbyMutation();

  if (isLoading || activeSessions.length === 0) return null;

  return (
    <Card className="p-6 mb-8 bg-cyan-950/20 border-cyan-500/20 glow-border-cyan text-left">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={16} className="text-cyan-400 animate-pulse" />
        <h3 className="font-extrabold text-sm text-white">Active Game Sessions</h3>
        <Badge variant="default" className="ml-auto">
          {activeSessions.length} Running
        </Badge>
      </div>

      <div className="space-y-3">
        {activeSessions.map((session) => (
          <div
            key={session.lobbyId}
            className="flex items-center justify-between p-3.5 bg-black/40 border border-cyan-500/10 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-xs text-[#00f0ff] border-cyan-500/30">
                {session.lobbyId.slice(0, 3)}-{session.lobbyId.slice(3)}
              </Badge>
              <div>
                <h4 className="font-bold text-xs text-white">{session.quizTitle}</h4>
                <p className="text-[10px] text-muted-foreground">Live Host Session</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="cyan"
                size="sm"
                onClick={() =>
                  navigate({
                    to: '/lobby/$lobbyId',
                    params: { lobbyId: session.lobbyId },
                    search: { username: user.name },
                  })
                }
              >
                <Play size={12} fill="currentColor" /> Rejoin
              </Button>
              <Button
                variant="destructive_ghost"
                size="icon"
                onClick={() => terminateLobbyMutation.mutate(session.lobbyId)}
                disabled={terminateLobbyMutation.isPending}
              >
                <LogOut size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
