import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { QuizRepository } from '../../ports/quiz.repository.port';
import { DATABASE_CONNECTION } from './database.module';
import type { DrizzleDb } from './database.module';
import { quizzes, quizSongs } from './schema';
import { Quiz, QuizMeta } from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class DrizzleQuizRepository implements QuizRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDb,
  ) {}

  public async findById(id: string): Promise<Quiz | null> {
    const result = await this.db.query.quizzes.findFirst({
      where: eq(quizzes.id, id),
      with: {
        songs: true,
      },
    });

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      creatorId: result.creatorId,
      createdAt: result.createdAt.toISOString(),
      songs: result.songs.map((song) => ({
        id: song.id,
        spotifyTrackId: song.spotifyTrackId,
        questionType: song.questionType as
          | 'TRACK_NAME'
          | 'ARTIST_NAME'
          | 'FILL_IN_THE_GAP',
        start_offset_ms: song.startOffsetMs,
        end_offset_ms: song.endOffsetMs,
        lyricsGap: song.lyricsGap,
        track: {
          id: song.spotifyTrackId,
          title: song.trackTitle,
          artist: song.trackArtist,
          album: song.trackAlbum,
          coverArtUrl: song.trackCoverArtUrl,
          previewUrl: song.trackPreviewUrl,
        },
      })),
    };
  }

  public async findAllMeta(): Promise<QuizMeta[]> {
    const results = await this.db.select().from(quizzes);
    return results.map((result) => ({
      id: result.id,
      title: result.title,
      description: result.description,
      creatorId: result.creatorId,
      createdAt: result.createdAt.toISOString(),
    }));
  }

  public async create(quiz: Omit<Quiz, 'createdAt'>): Promise<Quiz> {
    return await this.db.transaction(async (tx) => {
      const [insertedQuiz] = await tx
        .insert(quizzes)
        .values({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          creatorId: quiz.creatorId,
        })
        .returning();

      const songsToInsert = quiz.songs.map((song) => ({
        quizId: insertedQuiz.id,
        spotifyTrackId: song.spotifyTrackId,
        trackTitle: song.track.title,
        trackArtist: song.track.artist,
        trackAlbum: song.track.album,
        trackCoverArtUrl: song.track.coverArtUrl,
        trackPreviewUrl: song.track.previewUrl,
        questionType: song.questionType,
        startOffsetMs: song.start_offset_ms,
        endOffsetMs: song.end_offset_ms,
        lyricsGap: song.lyricsGap,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let insertedSongs: any[] = [];
      if (songsToInsert.length > 0) {
        insertedSongs = await tx
          .insert(quizSongs)
          .values(songsToInsert)
          .returning();
      }

      return {
        id: insertedQuiz.id,
        title: insertedQuiz.title,
        description: insertedQuiz.description,
        creatorId: insertedQuiz.creatorId,
        createdAt: insertedQuiz.createdAt.toISOString(),
        songs: insertedSongs.map((song) => ({
          id: song.id,
          spotifyTrackId: song.spotifyTrackId,
          questionType: song.questionType as
            | 'TRACK_NAME'
            | 'ARTIST_NAME'
            | 'FILL_IN_THE_GAP',
          start_offset_ms: song.startOffsetMs,
          end_offset_ms: song.endOffsetMs,
          lyricsGap: song.lyricsGap,
          track: {
            id: song.spotifyTrackId,
            title: song.trackTitle,
            artist: song.trackArtist,
            album: song.trackAlbum,
            coverArtUrl: song.trackCoverArtUrl,
            previewUrl: song.trackPreviewUrl,
          },
        })),
      };
    });
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(quizzes)
      .where(eq(quizzes.id, id))
      .returning();
    return result.length > 0;
  }
}
