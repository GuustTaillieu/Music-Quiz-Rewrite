import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useQuizGame } from '#/hooks/useQuizGame';
import {
  Users,
  Copy,
  Check,
  Crown,
  Play,
  Disc,
  Clock,
  Sparkles,
  Trophy,
  Music,
} from 'lucide-react';

const lobbySearchSchema = z.object({
  username: z.string(),
});

export const Route = createFileRoute('/lobby/$lobbyId')({
  validateSearch: lobbySearchSchema,
  component: LobbyRoomWrapper,
});

function LobbyRoomWrapper() {
  const { lobbyId } = Route.useParams();
  const { username } = Route.useSearch();
  const navigate = useNavigate();

  const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001';
  const {
    isConnected,
    gameState,
    error,
    lastGuessResult,
    joinLobby,
    startGame,
    submitGuess,
    passTurn,
  } = useQuizGame(wsUrl);

  const [copied, setCopied] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [showSpeedRoundModal, setShowSpeedRoundModal] = useState(false);
  // Audio preview reference for gameplay playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSongIndexRef = useRef<number | null>(null);

  // Connect and join lobby
  useEffect(() => {
    if (isConnected) {
      joinLobby(lobbyId, username);
    }
  }, [isConnected, lobbyId, username, joinLobby]);

  // Handle Local Audio Playback for all players
  useEffect(() => {
    if (!gameState || !gameState.activeSong) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const activeSong = gameState.activeSong;
    const songIndex = gameState.currentSongIndex;

    // Play if song index has advanced
    if (activeSong.previewUrl && songIndex !== prevSongIndexRef.current) {
      prevSongIndexRef.current = songIndex;

      // Handle Speed Round warning modal trigger
      if (gameState.phase === 'SPEED_ROUND') {
        setShowSpeedRoundModal(true);
        setTimeout(() => {
          setShowSpeedRoundModal(false);
          playAudio(activeSong.previewUrl!);
        }, 4000); // Show modal for 4 seconds before playing song
      } else {
        playAudio(activeSong.previewUrl);
      }
    }
  }, [gameState]);

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('Audio auto-play blocked by browser:', err);
      });

      // Stop play after the snippet duration
      const durationMs =
        (gameState?.activeSong?.end_offset_ms ?? 30000) -
        (gameState?.activeSong?.start_offset_ms ?? 0);

      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }, durationMs);

      return () => clearTimeout(timer);
    }
  };

  const handleCopyLobbyId = () => {
    navigator.clipboard.writeText(lobbyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    submitGuess(guessInput);
    setGuessInput('');
  };

  if (error) {
    return (
      <div className="page-wrap min-h-screen py-12 flex flex-col items-center justify-center">
        <div className="island-shell p-8 rounded-3xl text-center max-w-md w-full">
          <h2 className="display-title text-2xl font-bold text-destructive mb-4">
            Lobby Error
          </h2>
          <p className="text-foreground text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-3 px-6 rounded-xl cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Connecting to Lobby {lobbyId}...
        </p>
      </div>
    );
  }

  // Find our player object in lobby state
  // We match by username first to identify which player represents us
  const localPlayer = gameState.players.find(
    (p) => p.name.toLowerCase() === username.toLowerCase(),
  );

  const isHost = localPlayer?.isHost ?? false;

  // Determine current active player name
  const activePlayer = gameState.players.find(
    (p) => p.id === gameState.activePlayerId,
  );
  const isMyTurn = gameState.activePlayerId === localPlayer?.id;

  // ============================================================================
  // RENDER 1: LOBBY WAITING ROOM
  // ============================================================================
  if (gameState.phase === 'LOBBY') {
    return (
      <div className="page-wrap min-h-screen py-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl island-shell p-8 rounded-3xl relative overflow-hidden">
          {/* Decorative backdrop disc */}
          <Disc
            size={240}
            className="absolute -right-20 -bottom-20 text-muted-foreground/5 opacity-10 animate-spin"
            style={{ animationDuration: '20s' }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-line mb-8">
            <div>
              <div className="island-kicker mb-1">Multiplayer Lobby</div>
              <h1 className="display-title text-3xl font-black text-foreground">
                Waiting Room
              </h1>
            </div>
            {/* Lobby Code Board */}
            <div className="flex items-center gap-2 bg-foam/15 border border-line px-4 py-2.5 rounded-2xl">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                Lobby ID:
              </span>
              <span className="font-black text-xl text-foreground tracking-widest">
                {lobbyId}
              </span>
              <button
                onClick={handleCopyLobbyId}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foam/10 transition-colors"
              >
                {copied ? <Check size={16} className="text-lagoon" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Players List Grid */}
          <div className="mb-8">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={16} /> Players Joined ({gameState.players.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-foam/10 border border-line"
                >
                  <span className="font-bold text-foreground text-sm flex items-center gap-2">
                    {p.name}
                    {p.isHost && (
                      <Crown size={14} className="text-amber-500 fill-amber-500" />
                    )}
                  </span>
                  <span className="text-[10px] bg-lagoon/10 text-lagoon-deep font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {p.isHost ? 'Host' : 'Player'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Start Actions */}
          <div className="pt-4 border-t border-line flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lagoon animate-ping"></span>
              {isHost
                ? 'You are the host. Start whenever ready.'
                : 'Waiting for host Alice to start the quiz...'}
            </div>

            {isHost && (
              <button
                onClick={startGame}
                disabled={gameState.players.length < 1}
                className="bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={16} /> Start Game
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 2: COMPLETED LEADERBOARD
  // ============================================================================
  if (gameState.phase === 'COMPLETED') {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

    return (
      <div className="page-wrap min-h-screen py-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-xl island-shell p-8 rounded-3xl text-center relative overflow-hidden">
          <Trophy size={60} className="mx-auto text-amber-500 mb-4 animate-bounce" />
          <h1 className="display-title text-4xl font-black text-foreground mb-1">
            Quiz Completed!
          </h1>
          <p className="text-xs text-muted-foreground mb-8">
            Final scoreboard standings
          </p>

          <div className="space-y-3 mb-8">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${idx === 0
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-line'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-black text-lg ${idx === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {p.name}
                  </span>
                </div>
                <span className="font-black text-foreground text-lg">
                  {p.score} <span className="text-[10px] text-muted-foreground uppercase font-medium">pts</span>
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-3 px-6 rounded-xl cursor-pointer"
          >
            Exit Lobby
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 3: ACTIVE GAMEPLAY
  // ============================================================================
  const activeSong = gameState.activeSong;
  const isSpeedRound = gameState.phase === 'SPEED_ROUND';

  return (
    <div className="page-wrap min-h-screen py-12 flex flex-col lg:flex-row gap-8 justify-center items-stretch">
      {/* Audio instance */}
      <audio ref={audioRef} />

      {/* Speed Round Warning Modal Overlay */}
      {showSpeedRoundModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="island-shell p-8 rounded-3xl max-w-md text-center max-h-fit mx-4 scale-up border-lagoon/40 border-2">
            <Sparkles size={48} className="mx-auto text-lagoon mb-4 animate-spin" style={{ animationDuration: '4s' }} />
            <h2 className="display-title text-3xl font-black text-white uppercase tracking-wider mb-2">
              Speed Round!
            </h2>
            <p className="text-lagoon text-xs font-bold uppercase tracking-widest mb-4">
              Unfairness Prevention Mode
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              There are not enough songs left to guarantee equal turns for all players.
              The remaining songs are now open to **everyone simultaneously**!
              The fastest player with the correct answer wins the point. Get ready!
            </p>
            <div className="text-white font-black text-xl animate-pulse">
              Playing in a moment...
            </div>
          </div>
        </div>
      )}

      {/* Sidebar: Players & Scores */}
      <div className="w-full lg:w-80 island-shell p-6 rounded-3xl flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Leaderboard
            </h2>
            <span className="text-[10px] text-muted-foreground font-black">
              Lobby: {lobbyId}
            </span>
          </div>

          <div className="space-y-2">
            {gameState.players.map((p) => {
              const isPlayerActive = p.id === gameState.activePlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isPlayerActive
                      ? 'border-lagoon bg-lagoon/5 font-black'
                      : 'border-line'
                    } ${p.isDisconnected ? 'opacity-40' : ''}`}
                >
                  <span className="text-xs text-foreground flex items-center gap-1.5 truncate pr-2">
                    {p.name}
                    {p.isHost && <Crown size={12} className="text-amber-500" />}
                  </span>
                  <span className="text-xs font-bold text-foreground shrink-0">
                    {p.score} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground pt-4 border-t border-line mt-6 leading-normal">
          Song {gameState.currentSongIndex + 1} of {gameState.totalSongs}
          <div className="mt-1 font-bold text-foreground flex items-center gap-1">
            <Clock size={12} /> {isSpeedRound ? 'Speed Round Phase' : 'Turn-Based Phase'}
          </div>
        </div>
      </div>

      {/* Main Board: Playing Song & Guessing */}
      <div className="flex-1 island-shell p-8 rounded-3xl flex flex-col justify-between items-center text-center relative overflow-hidden">
        {/* Anti-cheat cover art disc */}
        {activeSong ? (
          <div className="w-full max-w-md flex flex-col items-center justify-center flex-1">
            <div className="relative group mb-6">
              <div className="h-48 w-48 rounded-full border-4 border-double border-line bg-foam/10 flex items-center justify-center overflow-hidden shadow-2xl relative">
                {activeSong.coverArtUrl ? (
                  <img
                    src={activeSong.coverArtUrl}
                    alt="Album Cover"
                    className="h-full w-full object-cover animate-spin"
                    style={{ animationDuration: '10s' }}
                  />
                ) : (
                  <Disc size={96} className="text-muted-foreground opacity-30 animate-spin" style={{ animationDuration: '8s' }} />
                )}
                {/* Visual state indicators */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                  <Music size={28} className="animate-bounce" />
                </div>
              </div>
            </div>

            <div className="mb-8">
              {/* Active question details */}
              <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-lagoon/10 text-lagoon-deep px-3 py-1 rounded-full mb-3">
                {activeSong.questionType === 'TRACK_NAME' && 'Guess the Track Name'}
                {activeSong.questionType === 'ARTIST_NAME' && 'Guess the Artist'}
                {activeSong.questionType === 'FILL_IN_THE_GAP' && 'Fill in the Lyrics Gap'}
              </span>

              {/* Obfuscated Title / Artist */}
              <h2 className="display-title text-3xl font-black text-foreground mb-1 leading-tight">
                {activeSong.title ?? '????'}
              </h2>
              <p className="text-muted-foreground font-semibold text-sm">
                by {activeSong.artist ?? '????'}
              </p>
              {activeSong.lyricsGap && (
                <div className="mt-4 p-3 bg-foam/15 border border-line rounded-xl font-medium italic text-foreground text-sm max-w-sm">
                  "... {activeSong.lyricsGap} ..."
                </div>
              )}
            </div>

            {/* Answer Guess Panel */}
            <div className="w-full max-w-sm">
              {isSpeedRound ? (
                // Speed Round Guess Form
                <div>
                  {gameState.playersGuessed.includes(localPlayer?.id ?? '') ? (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-wider">
                      Locked out! You guessed incorrectly.
                    </div>
                  ) : (
                    <form onSubmit={handleGuessSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type answer here..."
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        className="flex-1 bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-3 font-medium text-foreground focus:outline-none focus:border-lagoon text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-lagoon hover:bg-lagoon-deep text-white font-bold px-5 rounded-xl cursor-pointer"
                      >
                        Submit
                      </button>
                    </form>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Anyone can guess! First correct answer wins the point.
                  </p>
                </div>
              ) : (
                // Turn Based Guess Form
                <div>
                  {isMyTurn ? (
                    <form onSubmit={handleGuessSubmit} className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Your guess..."
                          value={guessInput}
                          onChange={(e) => setGuessInput(e.target.value)}
                          className="flex-1 bg-white dark:bg-foam/20 border border-line rounded-xl px-4 py-3 font-medium text-foreground focus:outline-none focus:border-lagoon text-sm"
                        />
                        <button
                          type="submit"
                          className="bg-lagoon hover:bg-lagoon-deep text-white font-bold px-5 rounded-xl cursor-pointer"
                        >
                          Submit
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={passTurn}
                        className="w-full bg-foam/15 hover:bg-foam/25 border border-line text-foreground text-xs font-bold py-2 rounded-xl cursor-pointer"
                      >
                        Pass Turn / I Don't Know
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 bg-foam/5 border border-line rounded-2xl flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <Clock size={16} className="animate-spin text-lagoon" />
                      Waiting for <span className="font-bold text-foreground">{activePlayer?.name ?? 'guesser'}</span> to guess or pass...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Toast feedback */}
            {lastGuessResult !== null && (
              <div
                className={`mt-4 text-sm font-black uppercase tracking-wider animate-bounce ${lastGuessResult ? 'text-lagoon-deep' : 'text-destructive'
                  }`}
              >
                {lastGuessResult ? '🎉 Correct!' : '❌ Incorrect!'}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="font-bold text-foreground">Waiting for song snippet...</h3>
          </div>
        )}
      </div>
    </div>
  );
}
