import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { SpotifyService } from './spotify.service';
import { SpotifyTokenService } from '../infrastructure/spotify/spotify-token.service';
import { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

@Controller('spotify')
@UseGuards(AuthGuard)
export class SpotifyController {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly tokenService: SpotifyTokenService,
  ) {}

  @Get('search')
  public async search(
    @Query('q') query: string,
    @Session() session: UserSession,
  ): Promise<SpotifyTrack[]> {
    const token = await this.tokenService.getHostAccessToken(session.user.id);
    return this.spotifyService.search(token, query ?? '');
  }

  @Get('token')
  public async getHostToken(
    @Session() session: UserSession,
  ): Promise<{ accessToken: string }> {
    const token = await this.tokenService.getHostAccessToken(session.user.id);
    return { accessToken: token };
  }

  @Get('lyrics')
  public async getLyrics(
    @Query('artist') artist: string,
    @Query('title') title: string,
  ): Promise<{ plainLyrics: string | null }> {
    return this.spotifyService.getLyrics(artist ?? '', title ?? '');
  }

  @Post('play')
  public async play(
    @Body() body: { deviceId: string; trackId: string; offsetMs?: number },
    @Session() session: UserSession,
  ): Promise<{ success: boolean }> {
    const token = await this.tokenService.getHostAccessToken(session.user.id);
    await this.spotifyService.playTrack(
      token,
      body.deviceId,
      body.trackId,
      body.offsetMs ?? 0,
    );
    return { success: true };
  }
}
