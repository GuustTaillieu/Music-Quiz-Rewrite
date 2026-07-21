import { Injectable } from '@nestjs/common';
import { SpotifyService as SpotifyServicePort } from '../ports/spotify.service.port';
import { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class SpotifyService {
  constructor(private readonly spotifyServicePort: SpotifyServicePort) {}

  public async search(hostAccessToken: string, query: string): Promise<SpotifyTrack[]> {
    return this.spotifyServicePort.searchTracks(hostAccessToken, query);
  }

  public async getLyrics(artist: string, title: string): Promise<{ plainLyrics: string | null }> {
    try {
      const url = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SpotifyMusicQuiz/1.0 (https://github.com/GuustTaillieu/spotify-music-quiz)',
        },
      });
      if (!response.ok) {
        return { plainLyrics: null };
      }
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const matched = results.find((r) => r.plainLyrics);
        return { plainLyrics: matched ? matched.plainLyrics : null };
      }
    } catch (e) {
      console.error('Lyrics fetch error in backend:', e);
    }
    return { plainLyrics: null };
  }
}
