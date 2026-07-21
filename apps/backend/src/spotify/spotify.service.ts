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
      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results) && results.length > 0) {
          const matched = results.find((r) => r.plainLyrics);
          if (matched?.plainLyrics) {
            return { plainLyrics: matched.plainLyrics };
          }
        }
      }
    } catch (e) {
      console.error('Lyrics fetch error in backend:', e);
    }
    return { plainLyrics: null };
  }

  public async playTrack(
    token: string,
    deviceId: string,
    trackId: string,
    positionMs = 0,
    retries = 2,
  ): Promise<void> {
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`],
          position_ms: positionMs,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || '';

        if (errMsg.includes('Restriction violated')) {
          return;
        }

        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 800));
          return this.playTrack(token, deviceId, trackId, positionMs, retries - 1);
        } else {
          throw new Error(errMsg || `Spotify play failed with status ${res.status}`);
        }
      }
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 800));
        return this.playTrack(token, deviceId, trackId, positionMs, retries - 1);
      }
      throw e;
    }
  }
}
