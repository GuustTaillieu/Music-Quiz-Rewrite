import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { PlayerWaitingRoomView } from '#/features/game-lobby';
import { PlayerBuzzerScreen, GameOverSummary, useQuizGame } from '#/features/game-player';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';
import { useEffect } from 'react';
import { GamePhase } from '@spotify-music-quiz/shared/schema/game';

const lobbySearchSchema = z.object({
  username: z.string(),
});

export const Route = createFileRoute('/guest/lobby/$lobbyId')({
  validateSearch: lobbySearchSchema,
  component: LobbyRoom,
});

function LobbyRoom() {
  const navigate = useNavigate();
  const { lobbyId } = Route.useParams();
  const { username } = Route.useSearch();
  const {
    isConnected,
    gameState,
    error,
    joinLobby,
  } = useQuizGame();

  useEffect(() => {
    if (isConnected) {
      joinLobby(lobbyId, username);
    }
  }, [isConnected, lobbyId, username, joinLobby]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] p-6 text-center">
        <div className="max-w-md w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-lg">
          <AlertCircle size={32} className="text-rose-400" />
          <h3 className="text-lg font-bold text-white">Could Not Join Lobby</h3>
          <p className="text-xs font-semibold text-rose-300/90">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/join' })}
            className="mt-2 border-rose-500/30 text-white hover:bg-rose-500/20 gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Join Page
          </Button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] p-6 text-center">
        <div className="flex items-center text-cyan-400 font-bold gap-2">
          <Loader2 className="animate-spin" size={24} />
          Connecting to lobby {lobbyId.toUpperCase().slice(0, 3)}-{lobbyId.toUpperCase().slice(3)}
        </div>
      </div>
    );
  }
  if (gameState.phase === GamePhase.LOBBY) {
    return <PlayerWaitingRoomView username={username} />
  }

  if (gameState.phase === GamePhase.COMPLETED) {
    return <GameOverSummary />
  }

  return <PlayerBuzzerScreen username={username} />;
}
