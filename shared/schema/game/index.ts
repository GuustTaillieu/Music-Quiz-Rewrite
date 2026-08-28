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

export const QuestionType = {
  TRACK_NAME: 'TRACK_NAME',
  ARTIST_NAME: 'ARTIST_NAME',
  FILL_IN_THE_GAP: 'FILL_IN_THE_GAP',
} as const;
export const QuestionTypeEnum = z.enum(QuestionType);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const ForkedFromInfoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  creatorName: z.string(),
});

export type ForkedFromInfo = z.infer<typeof ForkedFromInfoSchema>;

export const QuizSongSchema = z.object({
  id: z.string().uuid().optional(),
  originalSongId: z.string().uuid().nullable().optional(),
  isUserModified: z.boolean().optional(),
  spotifyTrackId: z.string(),
  track: SpotifyTrackSchema,
  questionType: QuestionTypeEnum,
  start_offset_ms: z.number().int().nonnegative(),
  end_offset_ms: z.number().int().positive(),
  lyricsGap: z.string().nullable().optional(),
  acceptedTitles: z.array(z.string()).optional(),
  acceptedArtists: z.array(z.string()).optional(),
  acceptedLyricsGaps: z.array(z.string()).optional(),
});

export type QuizSong = z.infer<typeof QuizSongSchema>;

export const QuizTitleSchema = z
  .string()
  .trim()
  .min(2, 'Title must be at least 2 characters long')
  .max(100, 'Title cannot exceed 100 characters');

export const QuizDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Description cannot exceed 500 characters')
  .nullable()
  .optional();

export const QuizMetaSchema = z.object({
  id: z.uuid(),
  title: QuizTitleSchema,
  description: QuizDescriptionSchema,
  creatorId: z.string(),
  createdAt: z.string(),
  songCount: z.number().int().nonnegative().optional(),
  forkedFromQuizId: z.string().uuid().nullable().optional(),
  forkedFrom: ForkedFromInfoSchema.nullable().optional(),
  isAiGenerated: z.boolean().optional(),
});

export type QuizMeta = z.infer<typeof QuizMetaSchema>;

export const SyncResultSchema = z.object({
  addedCount: z.number().int().nonnegative(),
  updatedCount: z.number().int().nonnegative(),
  preservedCount: z.number().int().nonnegative(),
});

export type SyncResult = z.infer<typeof SyncResultSchema>;

export const QuizSchema = QuizMetaSchema.extend({
  songs: z.array(QuizSongSchema),
});

export type Quiz = z.infer<typeof QuizSchema>;

// ============================================================================
// 2. Real-time Gameplay State Schemas
// ============================================================================

export const GamePhase = {
  LOBBY: 'LOBBY',
  TURN_BASED: 'TURN_BASED',
  SPEED_ROUND: 'SPEED_ROUND',
  COMPLETED: 'COMPLETED',
} as const;
export const GamePhaseEnum = z.enum(GamePhase);
export type GamePhase = z.infer<typeof GamePhaseEnum>;

export const GameMode = {
  TURN_BASED: 'TURN_BASED',
  SPEED_MODE: 'SPEED_MODE',
} as const;
export const GameModeEnum = z.enum(GameMode);
export type GameMode = z.infer<typeof GameModeEnum>;

export const RoundState = {
  GUESSING: 'GUESSING',
  REVEALED: 'REVEALED',
} as const;
export const RoundStateEnum = z.enum(RoundState);
export type RoundState = z.infer<typeof RoundStateEnum>;

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
  title: z.string().nullable(),
  artist: z.string().nullable(),
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
  playersGuessed: z.array(z.string()),
  playersPassed: z.array(z.string()),
  activeSong: ActiveSongInfoSchema.nullable(),
  roundState: RoundStateEnum.optional(),
  lastRoundWinnerId: z.string().nullable().optional(),
  gameMode: GameModeEnum,
  guessingTimeLimit: z.number().int().positive(),
  roundEndTime: z.number().nullable().optional(),
});

export type GameSessionState = z.infer<typeof GameSessionStateSchema>;

// ============================================================================
// 3. Client-to-Server Payload DTO Schemas (WebSocket/REST)
// ============================================================================

export const JoinLobbyPayloadSchema = z.object({
  lobbyId: z.string().min(1, 'Lobby ID is required'),
  username: z.string().min(1, 'Username is required'),
  playerSessionToken: z.string().optional(),
});

export type JoinLobbyPayload = z.infer<typeof JoinLobbyPayloadSchema>;

export const JoinSuccessPayloadSchema = z.object({
  lobbyId: z.string(),
  state: GameSessionStateSchema,
  playerSessionToken: z.string(),
});

export type JoinSuccessPayload = z.infer<typeof JoinSuccessPayloadSchema>;

export const CreateLobbyPayloadSchema = z.object({
  quizId: z.string().uuid('Invalid Quiz ID'),
});

export type CreateLobbyPayload = z.infer<typeof CreateLobbyPayloadSchema>;

export const GuessPayloadSchema = z.object({
  guess: z.string().min(1, 'Guess cannot be empty'),
});

export type GuessPayload = z.infer<typeof GuessPayloadSchema>;

// ============================================================================
// 4. AI Quiz Generation Schemas
// ============================================================================

export const GenerateQuizPayloadSchema = z.object({
  prompt: z.string().trim().min(3, 'Prompt must be at least 3 characters long'),
  trackCount: z.number().int().min(3).max(20).default(10),
  tags: z.array(z.string()).default([]),
  targetMode: z.enum(['INSTANT_PLAY', 'STUDIO']).default('INSTANT_PLAY'),
});

export type GenerateQuizPayload = z.infer<typeof GenerateQuizPayloadSchema>;

export const SuggestSongsPayloadSchema = z.object({
  quizId: z.string().uuid('Invalid Quiz ID'),
  prompt: z.string().trim().min(2, 'Prompt must be at least 2 characters long'),
  count: z.number().int().min(1).max(10).default(3),
});

export type SuggestSongsPayload = z.infer<typeof SuggestSongsPayloadSchema>;

export const UserAiProfileSchema = z.object({
  aiCredits: z.number().int().nonnegative(),
  hasCustomKey: z.boolean(),
  customKeyMasked: z.string().nullable().optional(),
});

export type UserAiProfile = z.infer<typeof UserAiProfileSchema>;

export const SetApiKeyPayloadSchema = z.object({
  apiKey: z.string().trim().nullable(),
});

export type SetApiKeyPayload = z.infer<typeof SetApiKeyPayloadSchema>;

