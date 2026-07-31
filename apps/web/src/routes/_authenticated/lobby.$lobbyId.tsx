import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { HostLobbyView, PlayerWaitingRoomView } from '#/features/game-lobby';
import { HostGameView } from '#/features/game-host';
import { PlayerBuzzerScreen, GameOverSummary, useQuizGame } from '#/features/game-player';
import { useAuth } from '#/features/auth';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { GamePhase } from '@spotify-music-quiz/shared/schema/game';

const lobbySearchSchema = z.object({
  username: z.string(),
});

export const Route = createFileRoute('/_authenticated/lobby/$lobbyId')({
  validateSearch: lobbySearchSchema,
  component: LobbyRoom,
});

function LobbyRoom() {
  const { lobbyId } = Route.useParams();
  const { username } = Route.useSearch();
  const { user } = useAuth();
  const {
    isConnected,
    gameState,
    joinLobby,
    isUserHost
  } = useQuizGame();
  const isHost = isUserHost(user.id);

  useEffect(() => {
    if (isConnected) {
      joinLobby(lobbyId, username, user.id);
    }
  }, [isConnected, lobbyId, username, joinLobby, user]);


  if (!gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] text-cyan-400 font-bold gap-2">
        <Loader2 className="animate-spin" size={24} />
        Connecting to lobby {lobbyId.toUpperCase().slice(0, 3)}-{lobbyId.toUpperCase().slice(3)}
      </div>
    );
  }
  if (gameState.phase === GamePhase.LOBBY) {
    return isHost ? <HostLobbyView /> : <PlayerWaitingRoomView username={username} />
  }

  if (gameState.phase === GamePhase.COMPLETED) {
    return <GameOverSummary />
  }

  return isHost ? <HostGameView /> : <PlayerBuzzerScreen username={username} />;
}
