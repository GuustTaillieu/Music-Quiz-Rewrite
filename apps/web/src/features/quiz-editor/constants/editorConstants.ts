export const EDITOR_CONSTANTS = Object.freeze({
  DEFAULT_START_OFFSET_MS: 0,
  DEFAULT_END_OFFSET_MS: 30000,
  PREVIEW_CHECK_INTERVAL_MS: 100,
  VIRTUALIZER_ROW_HEIGHT: 72,
  VIRTUALIZER_OVERSCAN: 5,
  SAMPLE_ADELE_GAP: "Never mind, I'll find [someone] like [you]",
  ERRORS: {
    PREVIEW_UNAVAILABLE: 'Preview not available for this track.',
    SPOTIFY_SDK_NOT_READY: 'Spotify player is initializing... Please try again in a moment.',
    NO_LYRICS_FOUND: 'No lyrics found for this track.',
    MISSING_METADATA: 'Missing artist or track title metadata.',
  },
  QUESTION_TYPE_OPTIONS: [
    { id: 'TRACK_NAME', label: 'Guess Track Name', description: 'The track name will be hidden' },
    { id: 'ARTIST_NAME', label: 'Guess Artist', description: 'The artist name will be hidden' },
    { id: 'FILL_IN_THE_GAP', label: 'Fill in the Lyrics', description: 'The selected parts of lyrics will be hidden' },
  ] as const,
});
