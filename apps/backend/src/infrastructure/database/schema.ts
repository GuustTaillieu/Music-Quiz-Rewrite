import { pgTable, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Better-Auth User Table
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  aiCredits: integer('ai_credits').default(5).notNull(),
  customGeminiApiKey: text('custom_gemini_api_key'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Better-Auth Session Table
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
});

// Better-Auth Account Table
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt').notNull(),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  expiresAt: timestamp('expiresAt'),
  password: text('password'),
  scope: text('scope'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

// Better-Auth Verification Table
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// Quizzes Table
export const quizzes = pgTable('quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  creatorId: text('creator_id').notNull(), // Guest creator or Auth creator
  forkedFromQuizId: uuid('forked_from_quiz_id').references((): any => quizzes.id, { onDelete: 'set null' }),
  isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Quiz Songs Table
export const quizSongs = pgTable('quiz_songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  originalSongId: uuid('original_song_id'),
  isUserModified: boolean('is_user_modified').default(false).notNull(),
  spotifyTrackId: text('spotify_track_id').notNull(),
  trackTitle: text('track_title').notNull(),
  trackArtist: text('track_artist').notNull(),
  trackAlbum: text('track_album').notNull(),
  trackCoverArtUrl: text('track_cover_art_url').notNull(),
  trackPreviewUrl: text('track_preview_url'),
  questionType: text('question_type').notNull(), // 'TRACK_NAME' | 'ARTIST_NAME' | 'FILL_IN_THE_GAP'
  startOffsetMs: integer('start_offset_ms').notNull(),
  endOffsetMs: integer('end_offset_ms').notNull(),
  lyricsGap: text('lyrics_gap'),
});

// Relations
export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  songs: many(quizSongs),
  creator: one(user, {
    fields: [quizzes.creatorId],
    references: [user.id],
  }),
  forkedFromQuiz: one(quizzes, {
    fields: [quizzes.forkedFromQuizId],
    references: [quizzes.id],
    relationName: 'quizForks',
  }),
}));

export const quizSongsRelations = relations(quizSongs, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizSongs.quizId],
    references: [quizzes.id],
  }),
}));
export type DbUser = typeof user.$inferSelect;
export type DbSession = typeof session.$inferSelect;
export type DbAccount = typeof account.$inferSelect;
export type DbVerification = typeof verification.$inferSelect;
export type DbQuiz = typeof quizzes.$inferSelect;
export type DbQuizSong = typeof quizSongs.$inferSelect;
