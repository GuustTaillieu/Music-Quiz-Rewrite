import type { SpotifyTrack } from '@spotify-music-quiz/shared/schema/game';

export const EDITOR_CONSTANTS = Object.freeze({
  DEFAULT_START_OFFSET_MS: 0,
  DEFAULT_END_OFFSET_MS: 30000,
  PREVIEW_CHECK_INTERVAL_MS: 100,
  VIRTUALIZER_ROW_HEIGHT: 72,
  VIRTUALIZER_OVERSCAN: 5,
  SAMPLE_ADELE_GAP: "Never mind, I'll find [someone] like [you]",
  ERRORS: {
    PREVIEW_UNAVAILABLE: 'Preview not available for this track.',
    SPOTIFY_SDK_NOT_READY: "Spotify Web Player is not ready. Please make sure your Spotify app is open and playing to activate the device 'Spotify Music Quiz Board'.",
    NO_LYRICS_FOUND: 'No lyrics found for this track.',
    MISSING_METADATA: 'Missing artist or track title metadata.',
  },
  SAMPLE_TRACKS: Object.freeze<SpotifyTrack[]>([
    {
      id: 'track-1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b2738863d6e38f6c1119c901cc60',
      durationMs: 200000,
      previewUrl: 'https://p.scdn.co/mp3-preview/b695e0c5d5f2a9675276e053a479ff6844966cb7',
    },
    {
      id: 'track-2',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      album: 'Divide',
      coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4962d6994ec38ee5',
      durationMs: 233000,
      previewUrl: 'https://p.scdn.co/mp3-preview/c873f274719c8f0e57dfc2a6886e3f49c0d38101',
    },
    {
      id: 'track-3',
      title: 'Someone Like You',
      artist: 'Adele',
      album: '21',
      coverArtUrl: 'https://i.scdn.co/image/ab67616d0000b273211516abdf4ffed863a0e10b',
      durationMs: 285000,
      previewUrl: 'https://p.scdn.co/mp3-preview/12cb348f95c479ff73a90a424269e98d9cc9b6c0',
    },
  ]),
});
