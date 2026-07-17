import { Quiz, QuizMeta } from '@spotify-music-quiz/shared/schema/game';

export abstract class QuizRepository {
  abstract findById(id: string): Promise<Quiz | null>;
  abstract findAllMeta(): Promise<QuizMeta[]>;
  abstract create(quiz: Omit<Quiz, 'createdAt'>): Promise<Quiz>;
  abstract delete(id: string): Promise<boolean>;
}
