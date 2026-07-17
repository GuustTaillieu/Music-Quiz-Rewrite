import { Module } from '@nestjs/common';
import { SpotifyService } from '../../ports/spotify.service.port';
import { MockSpotifyService } from './mock-spotify.service';

@Module({
  providers: [
    {
      provide: SpotifyService,
      useClass: MockSpotifyService,
    },
  ],
  exports: [SpotifyService],
})
export class SpotifyModule {}
