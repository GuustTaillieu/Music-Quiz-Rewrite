import { Injectable, NotFoundException } from '@nestjs/common';
import { QuizRepository } from '../ports/quiz.repository.port';
import { Quiz, QuizMeta } from '@spotify-music-quiz/shared/schema/game';

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

  public async remove(id: string): Promise<void> {
    const success = await this.quizRepository.delete(id);
    if (!success) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
  }
}
