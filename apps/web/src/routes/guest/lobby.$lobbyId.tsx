import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { PlayerWaitingRoomView } from '#/features/game-lobby';
import { PlayerBuzzerScreen, GameOverSummary, useQuizGame } from '#/features/game-player';
import { Loader2 } from 'lucide-react';
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
  const { lobbyId } = Route.useParams();
  const { username } = Route.useSearch();
  const {
    isConnected,
    gameState,
    joinLobby
  } = useQuizGame();

  useEffect(() => {
    if (isConnected) {
      joinLobby(lobbyId, username);
    }
  }, [isConnected, lobbyId, username, joinLobby]);


  if (!gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05070f] text-cyan-400 font-bold gap-2">
        <Loader2 className="animate-spin" size={24} />
        Connecting to lobby {lobbyId.toUpperCase().slice(0, 3)}-{lobbyId.toUpperCase().slice(3)}
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
