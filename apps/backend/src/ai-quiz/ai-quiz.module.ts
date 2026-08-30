import { Module } from '@nestjs/common';
import { AiQuizController } from './ai-quiz.controller';
import { AiQuizService } from './ai-quiz.service';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { SpotifyModule } from '../infrastructure/spotify/spotify.module';
import { SpotifyService } from '../spotify/spotify.service';
import { QuizzesService } from '../quizzes/quizzes.service';

@Module({
  imports: [DatabaseModule, SpotifyModule],
  controllers: [AiQuizController],
  providers: [AiQuizService, SpotifyService, QuizzesService],
  exports: [AiQuizService],
})
export class AiQuizModule {}
