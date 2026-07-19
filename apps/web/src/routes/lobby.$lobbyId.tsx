import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { z } from 'zod';
import { useQuizGame } from '#/hooks/useQuizGame';
import { useSpotifyPlayer } from '#/hooks/useSpotifyPlayer';
import { authClient } from '#/lib/auth-client';
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
  LogOut,
  LogOut as LeaveIcon,
  X,
  Volume2,
  Pause,
} from 'lucide-react';
import { cn } from '#/lib/utils';

const lobbySearchSchema = z.object({
  username: z.string(),
});

// Cava animated frequency bar visualizer canvas
function CavaVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 20;
    const barWidth = 6;
    const barGap = 3;

    // Fit canvas bounds
    canvas.width = barCount * (barWidth + barGap) - barGap;
    canvas.height = 40;

    // Phase angles for wave oscillators
    const phases = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2);
    const speeds = Array.from({ length: barCount }, () => 0.08 + Math.random() * 0.08);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        // Calculate dynamic height based on sine oscillators
        let height = 4;
        if (isPlaying) {
          phases[i] += speeds[i];
          const sine = Math.sin(phases[i]);
          height = 4 + Math.floor(Math.abs(sine) * (canvas.height - 8));
        } else {
          // Subtle idle floating pulse
          const sine = Math.sin(Date.now() * 0.002 + i * 0.5);
          height = 4 + Math.floor(Math.abs(sine) * 6);
        }

        const x = i * (barWidth + barGap);
        const y = canvas.height - height;

        // Draw neon cyan / magenta gradient bar
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, '#ff007f'); // Magenta top
        gradient.addColorStop(1, '#00f0ff'); // Cyan bottom

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 3);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
    />
  );
}

function LyricsDisplay({ lyrics, revealed }: { lyrics: string; revealed: boolean }) {
  const lines = lyrics.split('\n');

  return (
    <div className="space-y-2 font-mono text-center max-w-lg mx-auto overflow-y-auto max-h-[220px] p-4 bg-black/30 rounded-xl border border-line leading-relaxed text-xs select-none">
      {lines.map((lineText, lineIdx) => {
        const regex = /(\[[^\]]+\]|[^\s]+)/g;
        const matches = lineText.match(regex) || [];

        return (
          <div key={lineIdx} className="flex flex-wrap justify-center gap-x-1 min-h-[1.2rem]">
            {matches.length === 0 ? (
              <span className="opacity-0">&nbsp;</span>
            ) : (
              matches.map((token, tokenIdx) => {
                const isMasked = token.startsWith('[') && token.endsWith(']');
                const text = isMasked ? token.slice(1, -1) : token;

                if (isMasked) {
                  return (
                    <span
                      key={tokenIdx}
                      className={`px-1.5 py-0.5 rounded font-black border-b-2 transition-all ${revealed
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 scale-105 animate-pulse'
                        : 'bg-cyan-500/20 text-[#00f0ff] border-[#00f0ff]'
                        }`}
                    >
                      {revealed ? text : '_'.repeat(Math.max(5, text.length))}
                    </span>
                  );
                }

                return (
                  <span key={tokenIdx} className="text-foreground/85">
                    {text}
                  </span>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

interface GapBlock {
  id: number;
  wordCount: number;
  placeholder: string;
}

// Parses "[___] [____] like [_____]" into input structures
const parseGapBlocks = (lyrics: string | null | undefined): GapBlock[] => {
  if (!lyrics) return [];

  const blocks: GapBlock[] = [];
  const lines = lyrics.split('\n');
  let blockCounter = 0;

  lines.forEach((line) => {
    // Split by space
    const tokens = line.split(/\s+/);
    let inGapSequence = false;
    let currentWords = 0;

    tokens.forEach((token) => {
      const isGap = token.startsWith('[') && token.endsWith(']');
      if (isGap) {
        if (!inGapSequence) {
          inGapSequence = true;
          currentWords = 1;
        } else {
          currentWords++;
        }
      } else {
        if (inGapSequence) {
          // Commit previous gap block
          blocks.push({
            id: blockCounter++,
            wordCount: currentWords,
            placeholder: Array(currentWords).fill('_').join(' '),
          });
          inGapSequence = false;
          currentWords = 0;
        }
      }
    });

    // Commit if line ended with a gap
    if (inGapSequence) {
      blocks.push({
        id: blockCounter++,
        wordCount: currentWords,
        placeholder: Array(currentWords).fill('_').join(' '),
      });
    }
  });

  return blocks;
};

const formatTime = (ms: number | null | undefined) => {
  if (!ms) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Route = createFileRoute('/lobby/$lobbyId')({
  validateSearch: lobbySearchSchema,
  component: LobbyRoomWrapper,
});

function LobbyRoomWrapper() {
  const { lobbyId } = Route.useParams();
  const { username } = Route.useSearch();
  const navigate = useNavigate();
  const { data: sessionData } = authClient.useSession();

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
    nextSong,
    configureLobby,
    forceReveal,
    endGame,
  } = useQuizGame(wsUrl);

  const isLocalHost = gameState?.players.find((p) => p.name === username)?.isHost ?? false;
  const spotifyPlayer = useSpotifyPlayer(isLocalHost);

  const [copied, setCopied] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [gapAnswers, setGapAnswers] = useState<Record<number, string>>({});
  const [volume, setVolume] = useState(0.5);
  const [showSpeedRoundModal, setShowSpeedRoundModal] = useState(false);

  // Local Config Settings Inputs for Host
  const [selectedGameMode, setSelectedGameMode] = useState<'SPEED_MODE' | 'TURN_BASED'>('TURN_BASED');
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(30);

  // Timer variables
  const [timeLeft, setTimeLeft] = useState(30);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get Ready states for short rounds
  const [showGetReady, setShowGetReady] = useState(false);
  const [getReadyCount, setGetReadyCount] = useState(3);
  const getReadyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevGuesserSongIndexRef = useRef<number | null>(null);

  // Audio preview reference for gameplay playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect and join lobby
  useEffect(() => {
    if (isConnected) {
      joinLobby(lobbyId, username, sessionData?.user?.id);
    }
  }, [isConnected, lobbyId, username, joinLobby, sessionData?.user?.id]);

  // Sync configured settings from state
  useEffect(() => {
    if (gameState) {
      if (gameState.gameMode) {
        setSelectedGameMode(gameState.gameMode);
      }
      if (gameState.guessingTimeLimit) {
        setSelectedTimeLimit(gameState.guessingTimeLimit);
      }
    }
  }, [gameState?.gameMode, gameState?.guessingTimeLimit]);

  // Reset guess inputs on song changes
  useEffect(() => {
    setGuessInput('');
    setGapAnswers({});
  }, [gameState?.currentSongIndex]);

  // Guess countdown timer loop
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!gameState || gameState.phase === 'LOBBY' || gameState.phase === 'COMPLETED') {
      return;
    }

    if (gameState.roundState === 'REVEALED' || showGetReady) {
      return;
    }

    // Set initial timer
    setTimeLeft(gameState.guessingTimeLimit || 30);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;

          // Force reveal if we are the host
          if (isLocalHost) {
            forceReveal();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState?.currentSongIndex, gameState?.roundState, showGetReady, isLocalHost, forceReveal]);

  // Get Ready warning countdown triggers
  useEffect(() => {
    if (!gameState || gameState.phase === 'LOBBY' || gameState.phase === 'COMPLETED') {
      return;
    }

    const currentIdx = gameState.currentSongIndex;
    const isNewSong = currentIdx !== prevGuesserSongIndexRef.current;

    if (isNewSong && gameState.roundState === 'GUESSING') {
      prevGuesserSongIndexRef.current = currentIdx;

      if (gameState.guessingTimeLimit < 10) {
        setShowGetReady(true);
        setGetReadyCount(3);

        if (getReadyIntervalRef.current) clearInterval(getReadyIntervalRef.current);

        getReadyIntervalRef.current = setInterval(() => {
          setGetReadyCount((prev) => {
            if (prev <= 1) {
              if (getReadyIntervalRef.current) clearInterval(getReadyIntervalRef.current);
              getReadyIntervalRef.current = null;
              setShowGetReady(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setShowGetReady(false);
      }
    }
  }, [gameState?.currentSongIndex, gameState?.roundState, gameState?.guessingTimeLimit]);

  // Handle Local Audio Playback strictly for Host devices
  useEffect(() => {
    if (!isLocalHost) return;

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }

    if (!gameState || !gameState.activeSong || gameState.phase === 'LOBBY' || gameState.phase === 'COMPLETED' || showGetReady) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (spotifyPlayer.deviceId) {
        spotifyPlayer.pauseTrack();
      }
      return;
    }

    const activeSong = gameState.activeSong;
    const startOffset = activeSong.start_offset_ms || 0;
    const endOffset = activeSong.end_offset_ms || 30000;
    const isRevealed = gameState.roundState === 'REVEALED';

    // Play duration can be at most the guessingTimeLimit!
    const guessLimitMs = (gameState.guessingTimeLimit || 30) * 1000;
    const duration = Math.min(endOffset - startOffset, guessLimitMs);

    const triggerPlay = () => {
      if (spotifyPlayer.deviceId) {
        if (isRevealed) {
          // Do not autoplay full song. Default to paused when round is revealed!
          spotifyPlayer.pauseTrack();
        } else {
          // Play via Spotify Web Playback SDK
          spotifyPlayer.playTrack(activeSong.spotifyTrackId, startOffset);

          // Auto-pause when snippet duration is reached
          stopTimeoutRef.current = setTimeout(() => {
            spotifyPlayer.pauseTrack();
          }, duration);
        }
      } else if (activeSong.previewUrl) {
        if (isRevealed) {
          if (audioRef.current) audioRef.current.pause();
        } else {
          // Fallback to HTML5 audio preview
          playAudio(activeSong.previewUrl);

          // Auto-pause when snippet duration is reached (fallback caps at 30s)
          stopTimeoutRef.current = setTimeout(() => {
            if (audioRef.current) audioRef.current.pause();
          }, Math.min(duration, 30000));
        }
      }
    };

    // Replay song preview when index or active player changes
    triggerPlay();

    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [
    gameState?.currentSongIndex,
    gameState?.activePlayerId,
    gameState?.roundState,
    isLocalHost,
    spotifyPlayer.deviceId,
    showGetReady
  ]);

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('Audio auto-play blocked by browser:', err);
      });
    }
  };

  const handleCopyLobbyId = () => {
    navigator.clipboard.writeText(lobbyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalGuess = '';

    if (activeSong?.questionType === 'FILL_IN_THE_GAP') {
      const gapBlocks = parseGapBlocks(activeSong.lyricsGap);
      if (gapBlocks.length > 0) {
        finalGuess = gapBlocks
          .map((b) => (gapAnswers[b.id] || '').trim())
          .join('; ');
      } else {
        finalGuess = guessInput;
      }
    } else {
      finalGuess = guessInput;
    }

    if (!finalGuess.trim()) return;
    submitGuess(finalGuess);
    setGuessInput('');
    setGapAnswers({});
  };

  if (error) {
    return (
      <div className="page-wrap min-h-screen py-12 flex flex-col items-center justify-center bg-[#05070f]">
        <div className="island-shell p-8 rounded-3xl text-center max-w-md w-full">
          <h2 className="display-title text-2xl font-bold text-rose-500 mb-4">
            Lobby Error
          </h2>
          <p className="text-white text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] text-black font-black uppercase tracking-wider py-3.5 px-6 rounded-xl cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#05070f] text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent"></div>
        <p className="text-sm text-cyan-400 font-medium animate-pulse">
          Connecting to Lobby {lobbyId}...
        </p>
      </div>
    );
  }

  const localPlayer = gameState.players.find(
    (p) => p.name.toLowerCase() === username.toLowerCase(),
  );

  const isHost = localPlayer?.isHost ?? false;
  const hostPlayer = gameState.players.find((p) => p.isHost);
  const hostName = hostPlayer ? hostPlayer.name : 'the host';

  const activePlayer = gameState.players.find(
    (p) => p.id === gameState.activePlayerId,
  );

  const isSpeedRound = gameState.phase === 'SPEED_ROUND';
  const isRoundRevealed = gameState.roundState === 'REVEALED';
  const isLockedOut = localPlayer ? gameState.playersGuessed.includes(localPlayer.id) : false;
  const activeSong = gameState.activeSong;
  const isMyTurn = gameState.activePlayerId === localPlayer?.id;

  // ============================================================================
  // RENDER 1: LOBBY WAITING ROOM
  // ============================================================================
  if (gameState.phase === 'LOBBY') {
    return (
      <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
        {/* Synthwave background */}
        <div className="synth-grid absolute inset-0 pointer-events-none" />

        <div className="w-full max-w-2xl island-shell p-8 rounded-3xl relative overflow-hidden bg-black/60 border border-cyan-500/20 glow-border-cyan backdrop-blur-xl z-10 text-left">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-cyan-500/10 mb-8">
            <div>
              <div className="island-kicker mb-1 text-pink-400 font-bold uppercase tracking-wider text-xs">Multiplayer Lobby</div>
              <h1 className="display-title text-3xl font-black text-white glow-text-cyan">
                Waiting Room
              </h1>
            </div>
            {/* Lobby Code Board */}
            <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/20 px-4 py-2.5 rounded-2xl">
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">
                Lobby ID:
              </span>
              <span className="font-black text-xl text-[#00f0ff] tracking-widest">
                {lobbyId}
              </span>
              <button
                onClick={handleCopyLobbyId}
                className="p-1.5 text-cyan-400 hover:text-[#00f0ff] rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer"
              >
                {copied ? <Check size={16} className="text-cyan-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Lobby settings panel (Only shown to Host) */}
          {isHost && (
            <div className="mb-8 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-4">
              <h3 className="font-black text-[#00f0ff] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Lobby Configurations
              </h3>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-2">Game Mode</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'TURN_BASED', label: 'Turn-Based (One-by-One)' },
                    { id: 'SPEED_MODE', label: 'Speed Mode (All at once)' },
                  ].map((opt) => {
                    const isSel = selectedGameMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          const mode = opt.id as 'SPEED_MODE' | 'TURN_BASED';
                          setSelectedGameMode(mode);
                          configureLobby(mode, selectedTimeLimit);
                        }}
                        className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${isSel
                          ? 'bg-cyan-500/20 border-cyan-400 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.15)] font-black'
                          : 'bg-black/30 border-cyan-500/10 text-muted-foreground hover:text-white hover:border-cyan-500/25'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!isHost && (
            <div className="mb-8 p-4 bg-black/30 border border-cyan-500/10 rounded-2xl text-xs text-muted-foreground">
              <span>Game Mode: <strong className="text-white">{gameState.gameMode === 'SPEED_MODE' ? 'Speed Mode' : 'Turn-Based'}</strong></span>
            </div>
          )}

          {/* Players List Grid */}
          <div className="mb-8">
            <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-pink-400">
              <Users size={16} /> Players Joined ({gameState.players.filter((p) => !p.isHost).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {gameState.players.sort((a, b) => a.isHost ? -1 : 1).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-cyan-500/10 hover:border-cyan-400 transition-colors"
                >
                  <span className="font-bold text-white text-xs flex items-center gap-2">
                    {p.name}
                    {p.isHost && (
                      <Crown size={14} className="text-amber-500 fill-amber-500" />
                    )}
                  </span>
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", {
                    "bg-cyan-500/10 text-cyan-400": p.isHost,
                    "bg-pink-500/10 text-pink-400": !p.isHost,
                  })}>
                    {p.isHost ? 'Host' : 'Player'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Start Actions */}
          <div className="pt-4 border-t border-cyan-500/10 flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${gameState.players.filter((p) => !p.isHost).length < 2 ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400 animate-ping'}`}></span>
              {isHost
                ? (gameState.players.filter((p) => !p.isHost).length < 2
                  ? 'Need at least 2 guesser players to start.'
                  : 'Start whenever ready.')
                : `Waiting for ${hostName} to start the game...`}
            </div>

            <div className="flex items-center gap-3">
              {/* Exit Button */}
              <button
                onClick={() => navigate({ to: '/' })}
                className="border border-cyan-500/20 hover:bg-rose-500/10 hover:text-rose-400 text-muted-foreground text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              >
                Exit
              </button>

              {isHost && (
                <button
                  onClick={startGame}
                  disabled={gameState.totalSongs === 0 || gameState.players.filter((p) => !p.isHost).length < 2}
                  className="bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-black font-black uppercase tracking-wider py-2.5 px-5 rounded-xl active:scale-98 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                >
                  <Play size={14} fill="currentColor" /> Start Game
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 2: COMPLETED LEADERBOARD
  // ============================================================================
  if (gameState.phase === 'COMPLETED') {
    const sortedPlayers = [...gameState.players]
      .filter((p) => !p.isHost)
      .sort((a, b) => b.score - a.score);

    return (
      <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
        {/* Synthwave background */}
        <div className="synth-grid absolute inset-0 pointer-events-none" />

        <div className="w-full max-w-xl island-shell p-8 rounded-3xl text-center relative overflow-hidden bg-black/60 border border-cyan-500/20 glow-border-cyan backdrop-blur-xl z-10">
          <Trophy size={50} className="mx-auto text-yellow-400 mb-4 animate-bounce" />
          <h1 className="display-title text-3xl font-black text-white mb-1 glow-text-cyan">
            Game Completed!
          </h1>
          <p className="text-muted-foreground text-xs mb-8">
            The final standings for quiz lobby <strong className="text-white">{lobbyId}</strong>
          </p>

          <div className="space-y-3 mb-8 text-left">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${idx === 0
                  ? 'border-yellow-500/40 bg-yellow-500/5 font-black text-yellow-400'
                  : 'border-cyan-500/10 bg-black/30 text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black w-6">
                    #{idx + 1}
                  </span>
                  <span className="text-xs">{p.name}</span>
                </div>
                <span className="text-xs font-bold font-mono">
                  {p.score} pts
                </span>
              </div>
            ))}

            {sortedPlayers.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">No players completed the game.</p>
            )}
          </div>

          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-black font-black uppercase tracking-wider py-3.5 px-6 rounded-xl cursor-pointer text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 3: ACTIVE GAMEPLAY SCREEN (SPLIT: GUEST VS HOST)
  // ============================================================================

  // -------------------------------------------------------------
  // GUEST CONTROLLER VIEW (Mobile First / Single Viewport h-100dvh)
  // -------------------------------------------------------------
  if (!isHost) {
    return (
      <div className="relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden px-6 py-6 bg-[#05070f] text-white">
        {/* Synthwave static backdrop */}
        <div className="synth-grid absolute inset-0 pointer-events-none opacity-30" />

        {/* Get Ready Screen Overlay */}
        {showGetReady && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in text-center px-4">
            <div className="space-y-4 max-w-sm">
              <Sparkles size={40} className="mx-auto text-[#00f0ff] animate-pulse" />
              <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase leading-none">Get Ready!</h1>
              <p className="text-pink-400 font-bold uppercase tracking-widest text-[10px]">
                Fast Guess Round starts in
              </p>
              <div className="text-6xl font-black text-[#00f0ff] animate-ping scale-110">
                {getReadyCount}
              </div>
              <p className="text-muted-foreground text-xs leading-normal pt-4 border-t border-cyan-500/10">
                You only have <strong className="text-white">{gameState.guessingTimeLimit} seconds</strong> to submit your guess!
              </p>
            </div>
          </div>
        )}

        {/* Guess Correct/Incorrect Full-Screen Color Flash Overlays */}
        {lastGuessResult === true && (
          <div className="absolute inset-0 bg-emerald-500 z-40 flex flex-col items-center justify-center animate-flash-correct text-black">
            <Trophy size={60} className="animate-bounce" />
            <h1 className="text-3xl font-black uppercase tracking-wider mt-4">CORRECT!</h1>
            <p className="font-bold text-xs">+1 Point Earned</p>
          </div>
        )}
        {lastGuessResult === false && (
          <div className="absolute inset-0 bg-rose-600 z-40 flex flex-col items-center justify-center animate-flash-incorrect text-white">
            <X size={60} className="animate-shake" />
            <h1 className="text-3xl font-black uppercase tracking-wider mt-4 text-center">INCORRECT!</h1>
            <p className="font-medium text-xs text-rose-200">Locked out for this snippet</p>
          </div>
        )}

        {/* Header controller dashboard */}
        <div className="z-10 bg-black/40 border border-cyan-500/10 rounded-2xl p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-amber-500" />
            <span className="text-xs font-bold tracking-tight text-white">{username}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-mono text-[#00f0ff]">{localPlayer?.score ?? 0} pts</span>
            <button
              onClick={() => navigate({ to: '/' })}
              className="p-1 text-muted-foreground hover:text-rose-400"
              title="Leave Game"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Canvas Bar Visualizer / Lyrics masked display */}
        <div className="z-10 flex-1 flex flex-col items-center justify-center min-h-0 py-6 my-2 text-center">
          {isLockedOut ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/25 max-w-xs animate-pulse">
              <h3 className="font-black text-pink-400 text-sm uppercase tracking-wider mb-1">Locked Out</h3>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Your guess was incorrect. Waiting for the next snippet...
              </p>
            </div>
          ) : activeSong ? (
            <div className="w-full flex flex-col items-center justify-center space-y-5">
              {/* Question Banner */}
              <div className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[9px] font-black uppercase tracking-widest text-pink-400 shrink-0">
                {activeSong.questionType === 'TRACK_NAME' && 'Guess the Track Name'}
                {activeSong.questionType === 'ARTIST_NAME' && 'Guess the Artist'}
                {activeSong.questionType === 'FILL_IN_THE_GAP' && 'Fill in the Lyrics'}
              </div>

              {/* Monospace lyrics gap list if fill-gap */}
              {activeSong.questionType === 'FILL_IN_THE_GAP' && activeSong.lyricsGap ? (
                <div className="w-full max-h-40 overflow-y-auto pr-1 bg-black/40 border border-cyan-500/10 rounded-2xl p-4 flex flex-col justify-center select-none text-center">
                  <LyricsDisplay lyrics={activeSong.lyricsGap} revealed={false} />
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-2 shrink-0">
                  <CavaVisualizer isPlaying={gameState.roundState === 'GUESSING'} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Clock size={28} className="mx-auto text-cyan-400 animate-spin mb-3" />
              <p className="text-xs text-muted-foreground font-bold">Waiting for next song...</p>
            </div>
          )}
        </div>

        {/* Bottom Input Form / Status Panel */}
        <div className="z-10 bg-black/60 border border-cyan-500/20 rounded-3xl p-4 backdrop-blur-lg shrink-0 w-full max-w-md mx-auto mb-2 space-y-3">

          {/* Countdown timer bar */}
          {gameState.roundState === 'GUESSING' && (
            <div className="w-full shrink-0">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider mb-1 text-muted-foreground">
                <span>Guess Timer</span>
                <span className={timeLeft <= 5 ? 'text-rose-500 animate-pulse font-black' : 'text-cyan-400'}>
                  {timeLeft}s
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/40 border border-cyan-500/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-rose-500' : 'bg-cyan-400'
                    }`}
                  style={{ width: `${(timeLeft / gameState.guessingTimeLimit) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!isRoundRevealed && !isLockedOut && activeSong && (
            isSpeedRound || isMyTurn ? (
              <form onSubmit={handleGuessSubmit} className="space-y-3">
                {activeSong.questionType === 'FILL_IN_THE_GAP' && parseGapBlocks(activeSong.lyricsGap).length > 0 ? (
                  <div className="space-y-2.5">
                    {parseGapBlocks(activeSong.lyricsGap).map((block, idx) => (
                      <div key={block.id} className="flex flex-col text-left">
                        <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider mb-1">
                          Blank {idx + 1} ({block.wordCount} {block.wordCount === 1 ? 'word' : 'words'})
                        </span>
                        <input
                          type="text"
                          placeholder="Type hidden text..."
                          value={gapAnswers[block.id] || ''}
                          onChange={(e) => {
                            setGapAnswers((prev) => ({
                              ...prev,
                              [block.id]: e.target.value,
                            }));
                          }}
                          className="w-full bg-black/40 border border-cyan-500/20 text-white rounded-2xl px-4 py-2.5 font-medium placeholder-cyan-500/10 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] text-sm"
                        />
                      </div>
                    ))}
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] text-black font-black uppercase tracking-wider py-3 rounded-2xl cursor-pointer text-xs"
                    >
                      Submit Answers
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type answer here..."
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      className="flex-1 bg-black/40 border border-cyan-500/20 text-white rounded-2xl px-4 py-3 font-medium placeholder-cyan-500/10 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] text-black font-black uppercase tracking-wider px-5 rounded-2xl cursor-pointer text-xs"
                    >
                      Submit
                    </button>
                  </div>
                )}
                {!isSpeedRound && (
                  <button
                    type="button"
                    onClick={passTurn}
                    className="w-full bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-400 text-xs font-bold py-2.5 rounded-2xl cursor-pointer transition-all"
                  >
                    Pass Turn / I Don't Know
                  </button>
                )}
              </form>
            ) : (
              <div className="p-3.5 bg-black/40 border border-cyan-500/10 rounded-2xl flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <Clock size={14} className="animate-spin text-cyan-400" />
                Waiting for <span className="font-bold text-foreground">{activePlayer?.name ?? 'guesser'}</span>...
              </div>
            )
          )}

          {isRoundRevealed && (
            <div className="text-center text-xs font-semibold text-[#00f0ff] py-2 animate-pulse">
              Waiting for host to load next track snippet...
            </div>
          )}

          {isLockedOut && (
            <div className="text-center text-xs font-semibold text-pink-400 py-2 animate-pulse">
              Locked out. Wait for the next song.
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: HOST DISPLAY BOARD (Shared Screen / TV / Monitor)
  // -------------------------------------------------------------
  return (
    <div className="relative w-full min-h-screen py-12 flex flex-col justify-center items-center overflow-hidden px-4 bg-[#05070f] text-white">
      {/* Synthwave background */}
      <div className="synth-grid absolute inset-0 pointer-events-none" />
      <audio ref={audioRef} autoPlay={false} />

      {/* Speed Round Warning Modal Overlay */}
      {showSpeedRoundModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="island-shell p-8 rounded-3xl max-w-md text-center max-h-fit mx-4 scale-up border-[#ff007f] border-2 bg-black/90 shadow-[0_0_30px_rgba(255,0,127,0.3)] text-left">
            <Sparkles size={48} className="mx-auto text-pink-400 mb-4 animate-spin" style={{ animationDuration: '4s' }} />
            <h2 className="display-title text-3xl font-black text-white uppercase tracking-wider mb-2 glow-text-pink text-center">
              Speed Round!
            </h2>
            <p className="text-[#ff007f] text-[10px] font-black uppercase tracking-widest mb-4 text-center">
              Unfairness Prevention Mode
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-6">
              There are not enough songs left to guarantee equal turns for all players.
              The remaining songs are now open to **everyone simultaneously**!
              The fastest player with the correct answer wins the point. Get ready!
            </p>
            <div className="text-cyan-400 font-black text-lg animate-pulse text-center">
              Playing in a moment...
            </div>
          </div>
        </div>
      )}

      {/* Get Ready Warning Countdown Overlay */}
      {showGetReady && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in text-center px-4">
          <div className="space-y-4 max-w-sm">
            <Sparkles size={48} className="mx-auto text-[#00f0ff] animate-pulse" />
            <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase leading-none">Get Ready!</h1>
            <p className="text-pink-400 font-bold uppercase tracking-widest text-xs">
              Fast Guess Round starts in
            </p>
            <div className="text-6xl font-black text-[#00f0ff] animate-ping scale-110">
              {getReadyCount}
            </div>
            <p className="text-muted-foreground text-xs leading-normal pt-4 border-t border-cyan-500/10">
              You only have <strong className="text-white">{gameState.guessingTimeLimit} seconds</strong> to submit your guess!
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 justify-center items-stretch z-10">

        {/* Sidebar: Players & Scores */}
        <div className="w-full lg:w-80 island-shell p-6 rounded-3xl flex flex-col justify-between shrink-0 bg-black/60 border border-cyan-500/20 glow-border-cyan backdrop-blur-xl text-left">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/10 mb-4">
              <h2 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2 text-cyan-400">
                <Users size={16} /> Leaderboard
              </h2>
              <span className="text-[10px] text-cyan-400 font-black">
                Lobby: {lobbyId}
              </span>
            </div>

            <div className="space-y-2">
              {gameState.players
                .filter((p) => !p.isHost)
                .map((p) => {
                  const isPlayerActive = p.id === gameState.activePlayerId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isPlayerActive
                        ? 'border-cyan-400 bg-cyan-400/10 font-black shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                        : 'border-cyan-500/10 bg-black/30'
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

          <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-cyan-500/10">
            <div className="text-[10px] text-muted-foreground leading-normal">
              Song {gameState.currentSongIndex + 1} of {gameState.totalSongs}
              <div className="mt-1 font-bold text-cyan-400 flex items-center gap-1">
                <Clock size={12} /> {isSpeedRound ? 'Speed Round Phase' : 'Turn-Based Phase'}
              </div>

              {isLocalHost && (
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-cyan-500/5">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Volume2 size={11} /> Vol
                  </span>
                  <div className="flex items-center gap-2 flex-1 max-w-[130px] justify-end">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => {
                        const vol = parseFloat(e.target.value);
                        setVolume(vol);
                        if (audioRef.current) audioRef.current.volume = vol;
                        spotifyPlayer.setVolume(vol);
                      }}
                      className="w-full h-1 bg-black/40 rounded-full appearance-none cursor-pointer accent-[#00f0ff] border border-cyan-500/10"
                    />
                    <span className="text-[9px] font-mono text-muted-foreground w-6 text-right shrink-0">{Math.round(volume * 100)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Leave Option for Host */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to stop this game fully? This will disconnect all players.')) {
                  endGame();
                  navigate({ to: '/' });
                }
              }}
              className="w-full border border-rose-500/20 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <LeaveIcon size={14} /> Quit Game
            </button>
          </div>
        </div>

        {/* Main Board: Playing Song & Guessing */}
        <div className="flex-1 island-shell p-8 rounded-3xl flex flex-col justify-between items-center text-center relative overflow-hidden bg-black/60 border border-pink-500/20 glow-border-magenta backdrop-blur-xl">
          {activeSong ? (
            <div className="w-full max-w-md flex flex-col items-center justify-center flex-1">

              {/* Disc Spinning inside Circular Waveform Ring */}
              <div className="relative mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-cyan-400/40 pulse-glow p-2"></div>
                <div className="h-44 w-44 rounded-full border-4 border-cyan-400/35 bg-black/80 flex items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(0,240,255,0.2)] relative z-10">
                  {activeSong.coverArtUrl ? (
                    <img
                      src={activeSong.coverArtUrl}
                      alt="Album Cover"
                      className="h-full w-full object-cover animate-spin"
                      style={{ animationDuration: '10s' }}
                    />
                  ) : (
                    <Disc size={96} className="text-cyan-400 opacity-40 animate-spin" style={{ animationDuration: '8s' }} />
                  )}
                  {/* Center punch hole */}
                  <div className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-black border-2 border-cyan-400/35 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-cyan-400"></div>
                  </div>
                </div>
              </div>

              {/* Dynamic cava wave bars backdrop */}
              {gameState.roundState === 'GUESSING' && (
                <div className="mb-4">
                  <CavaVisualizer isPlaying={true} />
                </div>
              )}

              <div className="mb-6 w-full">
                {/* Active question details */}
                <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1 rounded-full mb-4">
                  {activeSong.questionType === 'TRACK_NAME' && 'Guess the Track Name'}
                  {activeSong.questionType === 'ARTIST_NAME' && 'Guess the Artist'}
                  {activeSong.questionType === 'FILL_IN_THE_GAP' && 'Fill in the Lyrics'}
                </span>

                {/* Obfuscated Title / Artist */}
                <h2 className="display-title text-3xl font-black text-white mb-1 leading-tight glow-text-cyan">
                  {activeSong.title ?? '????'}
                </h2>
                <p className="text-pink-400 font-semibold text-xs mb-4">
                  by {activeSong.artist ?? '????'}
                </p>

                {activeSong.lyricsGap && (
                  <div className="mt-4 w-full max-h-48 overflow-y-auto bg-black/40 border border-cyan-500/10 rounded-2xl p-4">
                    <LyricsDisplay
                      lyrics={activeSong.lyricsGap}
                      revealed={gameState.roundState === 'REVEALED'}
                    />
                  </div>
                )}
              </div>

              {/* Countdown Progress Bar */}
              {gameState.roundState === 'GUESSING' && (
                <div className="w-full max-w-sm mb-6 text-left">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-1.5">
                    <span className="text-muted-foreground">Guessing Window</span>
                    <span className={`font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/40 border border-cyan-500/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-cyan-400'
                        }`}
                      style={{ width: `${(timeLeft / gameState.guessingTimeLimit) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Answer Guess Status Panel */}
              <div className="w-full max-w-sm">
                {gameState.roundState === 'REVEALED' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold tracking-wide uppercase text-xs">
                      {gameState.lastRoundWinnerId ? (
                        `Solved by ${gameState.players.find((p) => p.id === gameState.lastRoundWinnerId)?.name ?? 'a player'}!`
                      ) : (
                        'Round Over! Time has run out.'
                      )}
                    </div>

                    {isLocalHost && (
                      <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-2xl space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">
                            Full Song Playback
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatTime(spotifyPlayer.currentPositionMs)} / {formatTime(spotifyPlayer.durationMs)}
                          </span>
                        </div>

                        {/* Timeline Scrubber */}
                        <input
                          type="range"
                          min="0"
                          max={spotifyPlayer.durationMs || 100}
                          value={spotifyPlayer.currentPositionMs}
                          onChange={async (e) => {
                            const seekMs = parseInt(e.target.value);
                            await spotifyPlayer.seekTrack(seekMs);
                          }}
                          className="w-full h-1 bg-black/40 rounded-full appearance-none cursor-pointer accent-[#00f0ff] border border-cyan-500/10"
                        />

                        {/* Play/Pause control button */}
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (spotifyPlayer.isPlaying) {
                                spotifyPlayer.pauseTrack();
                              } else {
                                if (spotifyPlayer.currentPositionMs === 0) {
                                  spotifyPlayer.playTrack(activeSong.spotifyTrackId, 0);
                                } else {
                                  spotifyPlayer.resumeTrack();
                                }
                              }
                            }}
                            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${spotifyPlayer.isPlaying
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-[#00f0ff]/10 border-cyan-500/30 text-[#00f0ff] hover:bg-[#00f0ff]/20'
                              }`}
                          >
                            {spotifyPlayer.isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {isLocalHost && (
                      <button
                        onClick={nextSong}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.45)] text-black font-black py-3.5 px-6 rounded-2xl active:scale-95 transition-all cursor-pointer text-xs tracking-widest uppercase animate-bounce"
                      >
                        Next Song
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center justify-center gap-3 text-xs text-cyan-400 animate-pulse">
                    <Clock size={16} className="animate-spin" />
                    Waiting for players to submit answers...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <h3 className="font-bold text-foreground">Waiting for song snippet...</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
