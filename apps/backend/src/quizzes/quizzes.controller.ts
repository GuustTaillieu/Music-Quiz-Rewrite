import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { QuizzesService } from './quizzes.service';
import { Quiz, QuizMeta, SyncResult, QuizTitleSchema, QuizDescriptionSchema } from '@spotify-music-quiz/shared/schema/game';
import { randomUUID } from 'crypto';

export class CreateQuizDto {
  title!: string;
  description?: string;
  songs!: Array<{
    id?: string;
    originalSongId?: string | null;
    isUserModified?: boolean;
    spotifyTrackId: string;
    track: {
      id: string;
      title: string;
      artist: string;
      album: string;
      coverArtUrl: string;
      previewUrl?: string | null;
    };
    questionType: 'TRACK_NAME' | 'ARTIST_NAME' | 'FILL_IN_THE_GAP';
    start_offset_ms: number;
    end_offset_ms: number;
    lyricsGap?: string | null;
  }>;
}

@Controller('quizzes')
@UseGuards(AuthGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  public async findAll(): Promise<QuizMeta[]> {
    return this.quizzesService.findAll();
  }

  @Get(':id')
  public async findOne(@Param('id') id: string): Promise<Quiz> {
    return this.quizzesService.findOne(id);
  }

  @Post()
  public async create(
    @Body() body: CreateQuizDto,
    @Session() session: UserSession,
  ): Promise<Quiz> {
    const titleResult = QuizTitleSchema.safeParse(body.title);
    if (!titleResult.success) {
      throw new BadRequestException(titleResult.error.issues[0]?.message || titleResult.error.message);
    }
    const descriptionResult = QuizDescriptionSchema.safeParse(body.description);
    if (!descriptionResult.success) {
      throw new BadRequestException(descriptionResult.error.issues[0]?.message || descriptionResult.error.message);
    }

    const quizId = randomUUID();
    const formattedSongs = (body.songs || []).map((song) => ({
      id: song.id || randomUUID(),
      originalSongId: song.originalSongId || null,
      isUserModified: song.isUserModified || false,
      spotifyTrackId: song.spotifyTrackId,
      questionType: song.questionType,
      start_offset_ms: song.start_offset_ms,
      end_offset_ms: song.end_offset_ms,
      lyricsGap: song.lyricsGap,
      track: {
        id: song.track.id,
        title: song.track.title,
        artist: song.track.artist,
        album: song.track.album,
        coverArtUrl: song.track.coverArtUrl,
        previewUrl: song.track.previewUrl,
      },
    }));
    return this.quizzesService.create({
      id: quizId,
      title: titleResult.data,
      description: descriptionResult.data ?? null,
      creatorId: session.user.id,
      songs: formattedSongs,
    });
  }

  @Post(':id/fork')
  public async fork(
    @Param('id') id: string,
    @Session() session: UserSession,
  ): Promise<Quiz> {
    return this.quizzesService.forkQuiz(id, session.user.id);
  }

  @Post(':id/sync')
  public async sync(
    @Param('id') id: string,
  ): Promise<SyncResult> {
    return this.quizzesService.syncQuizWithParent(id);
  }

  @Put(':id')
  public async update(
    @Param('id') id: string,
    @Body() body: CreateQuizDto,
  ): Promise<Quiz> {
    const titleResult = QuizTitleSchema.safeParse(body.title);
    if (!titleResult.success) {
      throw new BadRequestException(titleResult.error.issues[0]?.message || titleResult.error.message);
    }
    const descriptionResult = QuizDescriptionSchema.safeParse(body.description);
    if (!descriptionResult.success) {
      throw new BadRequestException(descriptionResult.error.issues[0]?.message || descriptionResult.error.message);
    }

    const formattedSongs = (body.songs || []).map((song) => ({
      id: song.id || randomUUID(),
      originalSongId: song.originalSongId || null,
      isUserModified: song.isUserModified ?? true,
      spotifyTrackId: song.spotifyTrackId,
      questionType: song.questionType,
      start_offset_ms: song.start_offset_ms,
      end_offset_ms: song.end_offset_ms,
      lyricsGap: song.lyricsGap,
      track: {
        id: song.track.id,
        title: song.track.title,
        artist: song.track.artist,
        album: song.track.album,
        coverArtUrl: song.track.coverArtUrl,
        previewUrl: song.track.previewUrl,
      },
    }));
    return this.quizzesService.update(id, {
      title: titleResult.data,
      description: descriptionResult.data ?? null,
      songs: formattedSongs,
    });
  }

  @Delete(':id')
  public async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.quizzesService.remove(id);
    return { success: true };
  }
}
