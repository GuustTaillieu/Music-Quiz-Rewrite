import { Injectable } from '@nestjs/common';
import { SpotifyService } from '../../ports/spotify.service.port';
import { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class MockSpotifyService implements SpotifyService {
  private readonly mockCatalog: SpotifyTrack[] = [
    {
      id: 'track-1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      coverArtUrl:
        'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=150',
      previewUrl:
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      durationMs: 180000,
    },
    {
      id: 'track-2',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      coverArtUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
      previewUrl:
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      durationMs: 180000,
    },
    {
      id: 'track-3',
      title: 'Someone Like You',
      artist: 'Adele',
      album: '21',
      coverArtUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
      previewUrl:
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      durationMs: 180000,
    },
    {
      id: 'track-4',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      album: 'Divide',
      coverArtUrl:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150',
      previewUrl:
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      durationMs: 180000,
    },
    {
      id: 'track-5',
      title: 'Bad Guy',
      artist: 'Billie Eilish',
      album: 'When We All Fall Asleep',
      coverArtUrl:
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=150',
      previewUrl:
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      durationMs: 180000,
    },
  ];

  public async searchTracks(
    hostAccessToken: string,
    query: string,
    limit = 10,
  ): Promise<SpotifyTrack[]> {
    const q = query.toLowerCase().trim();
    if (!q) {
      return [];
    }
    return this.mockCatalog
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q),
      )
      .slice(0, limit);
  }

  public async getTrack(
    hostAccessToken: string,
    id: string,
  ): Promise<SpotifyTrack | null> {
    return this.mockCatalog.find((t) => t.id === id) ?? null;
  }

  public async controlPlayback(
    hostAccessToken: string,
    trackId: string,
    action: 'play' | 'pause',
    offsetMs?: number,
  ): Promise<void> {
    console.log(
      `Mock Spotify Playback control: ${action} track ${trackId} at offset ${offsetMs} (token: ${hostAccessToken})`,
    );
  }
  public async transferPlayback(hostAccessToken: string, deviceId: string): Promise<void> {
    console.log(
      `Mock Spotify Playback control: transfer playback to device ${deviceId} (token: ${hostAccessToken})`,
    );
  }
}
