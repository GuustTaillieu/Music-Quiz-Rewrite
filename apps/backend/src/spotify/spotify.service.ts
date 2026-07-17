import { Injectable } from '@nestjs/common';
import { SpotifyService as SpotifyServicePort } from '../ports/spotify.service.port';
import { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class SpotifyService {
  constructor(private readonly spotifyServicePort: SpotifyServicePort) {}

  public async search(query: string): Promise<SpotifyTrack[]> {
    return this.spotifyServicePort.searchTracks(query);
  }
}
