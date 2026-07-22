export const LOBBY_CONSTANTS = Object.freeze({
  DEFAULT_GAME_MODE: 'BUZZER_NORMAL',
  AUDIO_SYNC_INTERVAL_MS: 100,
  TIMER_INTERVAL_MS: 1000,
  FAST_GUESS_WARNING_THRESHOLD_SECS: 10,
  CAVA_BAR_COUNT: 24,
  MAX_CAVA_HEIGHT_PX: 40,
  RETRY_PLAYBACK_DELAY_MS: 800,
  GAME_MODES: [
    { id: 'BUZZER_NORMAL', label: 'Buzzer First', icon: '⚡' },
    { id: 'SPEED_RACE', label: 'Speed Race (All Guess)', icon: '🏎️' },
    { id: 'MULTIPLE_CHOICE', label: 'Multiple Choice', icon: '🎯' },
  ],
});
