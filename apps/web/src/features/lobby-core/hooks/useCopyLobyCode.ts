import { useQuizGame } from "#/features/game-player";
import { useState } from "react";

export function useCopyLobbyCode() {
    const { gameState } = useQuizGame()
    const [isCopied, setIsCopied] = useState(false);

    if (!gameState?.lobbyId) {
        throw Error("Cannot use this hook outside of a game session!")
    }

    const handleCopyCode = () => {
        navigator.clipboard.writeText(gameState.lobbyId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return {
        handleCopyCode,
        isCopied,
        lobbyCode: gameState.lobbyId,
        formattedLobbyId: gameState.lobbyId.length === 6 ? `${gameState.lobbyId.slice(0, 3)}-${gameState.lobbyId.slice(3)}` : gameState.lobbyId
    };
}