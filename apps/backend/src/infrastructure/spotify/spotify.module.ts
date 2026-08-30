import { Module } from '@nestjs/common';
import { SpotifyService } from '../../ports/spotify.service.port';
import { MockSpotifyService } from './mock-spotify.service';
import { RealSpotifyService } from './real-spotify.service';
import { SpotifyTokenService } from './spotify-token.service';
import { DatabaseModule } from '../database/database.module';
import { env } from '../../env';

@Module({
  imports: [DatabaseModule],
  providers: [
    SpotifyTokenService,
    {
      provide: SpotifyService,
      useFactory: (tokenService: SpotifyTokenService) => {
        const useMock = env.USE_MOCK_SPOTIFY;
        return useMock
          ? new MockSpotifyService()
          : new RealSpotifyService(tokenService);
      },
      inject: [SpotifyTokenService],
    },
  ],
  exports: [SpotifyService, SpotifyTokenService],
})
export class SpotifyModule {}
