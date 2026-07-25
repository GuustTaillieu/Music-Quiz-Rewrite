import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { QuizRepository } from '../ports/quiz.repository.port';
import { Quiz, QuizMeta, SyncResult } from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class QuizzesService {
  constructor(private readonly quizRepository: QuizRepository) {}

  public async findAll(): Promise<QuizMeta[]> {
    return this.quizRepository.findAllMeta();
  }

  public async findOne(id: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findById(id);
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return quiz;
  }

  public async create(
    quizData: Omit<Quiz, 'createdAt'>,
  ): Promise<Quiz> {
    return this.quizRepository.create(quizData);
  }

  public async update(
    id: string,
    quizData: Omit<Quiz, 'createdAt' | 'id' | 'creatorId'>,
  ): Promise<Quiz> {
    try {
      return await this.quizRepository.update(id, quizData);
    } catch (error) {
      throw new NotFoundException((error as Error).message);
    }
  }

  public async remove(id: string): Promise<void> {
    const success = await this.quizRepository.delete(id);
    if (!success) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
  }

  public async forkQuiz(quizId: string, userId: string): Promise<Quiz> {
    const originalQuiz = await this.findOne(quizId);
    const newQuizId = randomUUID();

    const forkedQuiz: Omit<Quiz, 'createdAt'> = {
      id: newQuizId,
      title: `${originalQuiz.title} (Fork)`,
      description: originalQuiz.description,
      creatorId: userId,
      forkedFromQuizId: originalQuiz.id,
      songs: originalQuiz.songs.map((song) => ({
        ...song,
        id: randomUUID(),
        originalSongId: song.id,
        isUserModified: false,
      })),
    };

    return this.quizRepository.create(forkedQuiz);
  }

  public async syncQuizWithParent(forkedQuizId: string): Promise<SyncResult> {
    const forkedQuiz = await this.findOne(forkedQuizId);
    if (!forkedQuiz.forkedFromQuizId) {
      throw new BadRequestException('This quiz is not forked from an upstream quiz');
    }

    const parentQuiz = await this.findOne(forkedQuiz.forkedFromQuizId);

    let addedCount = 0;
    let updatedCount = 0;
    let preservedCount = 0;

    const parentSongsMap = new Map(parentQuiz.songs.map((s) => [s.id!, s]));
    const clonedOriginalMap = new Map(
      forkedQuiz.songs
        .filter((s) => s.originalSongId)
        .map((s) => [s.originalSongId!, s]),
    );

    const mergedSongs = [...forkedQuiz.songs];

    for (const [parentSongId, parentSong] of parentSongsMap.entries()) {
      const existingClonedSong = clonedOriginalMap.get(parentSongId);

      if (!existingClonedSong) {
        // New song in parent -> add to cloned quiz
        mergedSongs.push({
          ...parentSong,
          id: randomUUID(),
          originalSongId: parentSongId,
          isUserModified: false,
        });
        addedCount++;
      } else {
        if (existingClonedSong.isUserModified) {
          // User edited this specific song -> preserve user version
          preservedCount++;
        } else {
          // Parent updated -> update cloned song properties
          const songIndex = mergedSongs.findIndex((s) => s.id === existingClonedSong.id);
          if (songIndex !== -1) {
            mergedSongs[songIndex] = {
              ...existingClonedSong,
              spotifyTrackId: parentSong.spotifyTrackId,
              track: parentSong.track,
              questionType: parentSong.questionType,
              start_offset_ms: parentSong.start_offset_ms,
              end_offset_ms: parentSong.end_offset_ms,
              lyricsGap: parentSong.lyricsGap,
              isUserModified: false,
            };
            updatedCount++;
          }
        }
      }
    }

    await this.quizRepository.update(forkedQuizId, {
      title: forkedQuiz.title,
      description: forkedQuiz.description,
      songs: mergedSongs,
    });

    return {
      addedCount,
      updatedCount,
      preservedCount,
    };
  }
}
