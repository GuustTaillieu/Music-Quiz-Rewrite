import { Injectable, Logger } from '@nestjs/common';
import { SpotifyService } from '../../ports/spotify.service.port';
import { SpotifyTokenService } from './spotify-token.service';
import { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class RealSpotifyService implements SpotifyService {
  private readonly logger = new Logger(RealSpotifyService.name);

  constructor(private readonly tokenService: SpotifyTokenService) { }
  async transferPlayback(hostAccessToken: string, deviceId: string, retries: number = 3): Promise<void> {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${hostAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });
      this.logger.log(`Transferred playback to device ${deviceId} successfully`);
    } catch (tErr) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return this.transferPlayback(hostAccessToken, deviceId, retries - 1);
      } else {
        this.logger.error('Failed to transfer playback to device:', tErr);
        throw tErr;
      }
    }
  }

  private mapSpotifyTrack(track: any): SpotifyTrack {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') ?? 'Unknown Artist',
      album: track.album?.name ?? 'Unknown Album',
      coverArtUrl:
        track.album?.images?.[0]?.url ??
        'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=150',
      previewUrl: track.preview_url ?? null,
      durationMs: track.duration_ms ?? null,
    };
  }

  public async searchTracks(
    hostAccessToken: string,
    query: string,
    limit = 10,
  ): Promise<SpotifyTrack[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQuery)}&type=track&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${hostAccessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Spotify Search API returned status ${response.status}`);
      }

      const data = (await response.json()) as {
        tracks?: {
          items: any[];
        };
      };

      return data.tracks?.items.map((item) => this.mapSpotifyTrack(item)) ?? [];
    } catch (err) {
      this.logger.error(`Spotify search failed for query "${query}":`, err);
      return [];
    }
  }

  public async getTrack(
    hostAccessToken: string,
    id: string,
  ): Promise<SpotifyTrack | null> {
    try {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: {
          Authorization: `Bearer ${hostAccessToken}`,
        },
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Spotify Track API returned status ${response.status}`);
      }

      const data = await response.json();
      return this.mapSpotifyTrack(data);
    } catch (err) {
      this.logger.error(`Spotify getTrack failed for ID "${id}":`, err);
      return null;
    }
  }

  public async controlPlayback(
    hostAccessToken: string,
    trackId: string,
    action: 'play' | 'pause',
    offsetMs?: number,
  ): Promise<void> {
    try {
      const url = `https://api.spotify.com/v1/me/player/${action}`;
      const isPlay = action === 'play';

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${hostAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: isPlay
          ? JSON.stringify({
            uris: [`spotify:track:${trackId}`],
            position_ms: offsetMs ?? 0,
          })
          : undefined,
      });

      if (response.status === 404) {
        throw new Error(
          'No active Spotify Connect device was found. Please open Spotify on your phone, computer, or TV and verify you are active.',
        );
      }

      if (response.status === 403) {
        throw new Error(
          'Spotify Premium account is required to control playback programmatically.',
        );
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Spotify control playback failed: ${response.statusText} - ${errText}`);
      }

      this.logger.log(`Controlled Spotify playback successfully: ${action} track ${trackId}`);
    } catch (err) {
      this.logger.error(`Failed to control Spotify playback:`, err);
      throw err;
    }
  }
}
