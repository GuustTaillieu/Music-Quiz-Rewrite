import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { SpotifyService } from './spotify.service';
import { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

@Controller('spotify')
@UseGuards(AuthGuard)
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('search')
  public async search(
    @Query('q') query: string,
  ): Promise<SpotifyTrack[]> {
    return this.spotifyService.search(query ?? '');
  }
}
