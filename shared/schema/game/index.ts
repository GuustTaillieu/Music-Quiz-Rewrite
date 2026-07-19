import { z } from 'zod';

// ============================================================================
// 1. Spotify & Quiz Domain Schemas
// ============================================================================

export const SpotifyTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  coverArtUrl: z.string().url(),
  previewUrl: z.string().url().nullable().optional(),
  durationMs: z.number().int().positive().optional().nullable(),
});

export type SpotifyTrack = z.infer<typeof SpotifyTrackSchema>;

export const QuestionTypeEnum = z.enum(['TRACK_NAME', 'ARTIST_NAME', 'FILL_IN_THE_GAP']);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const QuizSongSchema = z.object({
  id: z.string().uuid().optional(),
  spotifyTrackId: z.string(),
  track: SpotifyTrackSchema,
  questionType: QuestionTypeEnum,
  start_offset_ms: z.number().int().nonnegative(),
  end_offset_ms: z.number().int().positive(),
  lyricsGap: z.string().nullable().optional(),
});

export type QuizSong = z.infer<typeof QuizSongSchema>;

export const QuizMetaSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  creatorId: z.string(),
  createdAt: z.string().datetime(),
});

export type QuizMeta = z.infer<typeof QuizMetaSchema>;

export const QuizSchema = QuizMetaSchema.extend({
  songs: z.array(QuizSongSchema),
});

export type Quiz = z.infer<typeof QuizSchema>;

// ============================================================================
// 2. Real-time Gameplay State Schemas
// ============================================================================

export const GamePhaseEnum = z.enum(['LOBBY', 'TURN_BASED', 'SPEED_ROUND', 'COMPLETED']);
export type GamePhase = z.infer<typeof GamePhaseEnum>;

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().int().nonnegative(),
  isHost: z.boolean(),
  isDisconnected: z.boolean(),
});

export type Player = z.infer<typeof PlayerSchema>;

// Sanitized quiz song info sent to active players to prevent cheating
export const ActiveSongInfoSchema = z.object({
  spotifyTrackId: z.string(),
  questionType: QuestionTypeEnum,
  start_offset_ms: z.number(),
  end_offset_ms: z.number(),
  lyricsGap: z.string().nullable().optional(),
  // Obfuscated details based on question type
  title: z.string().nullable(), // Null if questionType is TRACK_NAME
  artist: z.string().nullable(), // Null if questionType is ARTIST_NAME
  album: z.string().nullable(),
  coverArtUrl: z.string().nullable(),
  previewUrl: z.string().nullable().optional(),
});

export type ActiveSongInfo = z.infer<typeof ActiveSongInfoSchema>;

export const GameSessionStateSchema = z.object({
  lobbyId: z.string(),
  hostId: z.string(),
  phase: GamePhaseEnum,
  players: z.array(PlayerSchema),
  currentSongIndex: z.number().int().nonnegative(),
  totalSongs: z.number().int().nonnegative(),
  activePlayerId: z.string().nullable(),
  turnOrder: z.array(z.string()),
  // Track players who already guessed or passed the current song
  playersGuessed: z.array(z.string()),
  playersPassed: z.array(z.string()),
  activeSong: ActiveSongInfoSchema.nullable(),
  roundState: z.enum(['GUESSING', 'REVEALED']).optional(),
  lastRoundWinnerId: z.string().nullable().optional(),
});

export type GameSessionState = z.infer<typeof GameSessionStateSchema>;

// ============================================================================
// 3. Client-to-Server Payload DTO Schemas (WebSocket/REST)
// ============================================================================

export const JoinLobbyPayloadSchema = z.object({
  lobbyId: z.string().min(1, 'Lobby ID is required'),
  username: z.string().min(1, 'Username is required'),
});

export type JoinLobbyPayload = z.infer<typeof JoinLobbyPayloadSchema>;

export const CreateLobbyPayloadSchema = z.object({
  quizId: z.string().uuid('Invalid Quiz ID'),
});

export type CreateLobbyPayload = z.infer<typeof CreateLobbyPayloadSchema>;

export const GuessPayloadSchema = z.object({
  guess: z.string().min(1, 'Guess cannot be empty'),
});

export type GuessPayload = z.infer<typeof GuessPayloadSchema>;
