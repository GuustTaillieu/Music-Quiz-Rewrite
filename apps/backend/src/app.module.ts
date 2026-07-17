import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { SpotifyModule } from './infrastructure/spotify/spotify.module';
import { GameController } from './game/game.controller';
import { GameGateway } from './game/game.gateway';
import { GameService } from './game/game.service';
import { QuizzesController } from './quizzes/quizzes.controller';
import { QuizzesService } from './quizzes/quizzes.service';
import { SpotifyController } from './spotify/spotify.controller';
import { SpotifyService } from './spotify/spotify.service';

@Module({
  imports: [DatabaseModule, AuthModule, SpotifyModule],
  controllers: [AppController, GameController, QuizzesController, SpotifyController],
  providers: [AppService, GameGateway, GameService, QuizzesService, SpotifyService],
})
export class AppModule {}
