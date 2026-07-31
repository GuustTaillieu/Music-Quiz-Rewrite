import { useQuizGame } from "#/features/game-session/hooks/useQuizGame";
import { parseGapBlocks } from "#/features/shared/utils/lobbyUtils";
import { useEffect, useState } from "react";
import type { SubmitEventHandler } from "react";

export function usePlayerActions() {
    const { gameState, submitGuess } = useQuizGame()

    const [guessInput, setGuessInput] = useState('');
    const [gapInputs, setGapInputs] = useState<Record<number, string>>({});

    useEffect(() => {
        setGuessInput('');
        setGapInputs({});
    }, [gameState?.currentSongIndex]);

    const handleGapSubmit: SubmitEventHandler = (e) => {
        e.preventDefault();
        const activeSong = gameState?.activeSong;
        const gapBlocks = parseGapBlocks(activeSong?.lyricsGap);
        const answers = gapBlocks.map((block) => (gapInputs[block.id] || '').trim());
        submitGuess(answers.join(' '));
    };

    const handleGuessSubmit: SubmitEventHandler = (e) => {
        e.preventDefault();
        if (!guessInput.trim()) return;
        submitGuess(guessInput.trim());
        setGuessInput('');
    };

    return {
        guessInput,
        setGuessInput,
        gapInputs,
        setGapInputs,
        handleGapSubmit,
        handleGuessSubmit
    }
}