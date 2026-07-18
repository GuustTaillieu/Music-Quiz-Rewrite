import { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

export abstract class SpotifyService {
  abstract searchTracks(
    hostAccessToken: string,
    query: string,
    limit?: number,
  ): Promise<SpotifyTrack[]>;
  abstract getTrack(
    hostAccessToken: string,
    id: string,
  ): Promise<SpotifyTrack | null>;
  abstract controlPlayback(
    hostAccessToken: string,
    trackId: string,
    action: 'play' | 'pause',
    offsetMs?: number,
  ): Promise<void>;
}
