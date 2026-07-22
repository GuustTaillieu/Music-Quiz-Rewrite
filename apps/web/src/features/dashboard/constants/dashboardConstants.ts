export const DASHBOARD_CONSTANTS = Object.freeze({
  LOBBY_CODE_MAX_LENGTH: 4,
  REFETCH_INTERVAL_MS: 5000,
  ERRORS: {
    PREMIUM_REQUIRED: 'Spotify Premium account is required to host games.',
    SIGNIN_FAILED: 'Sign-in failed. Please try again.',
    LOBBY_NOT_FOUND: 'Lobby not found. Check the code and try again.',
    CODE_LENGTH_INVALID: 'Lobby code must be exactly 4 letters.',
    USERNAME_REQUIRED: 'Please enter a username.',
    LOBBY_CREATE_FAILED: 'Could not start lobby. Make sure you are logged in.',
  },
  PLACEHOLDERS: {
    JOIN_CODE: 'XXXX',
    USERNAME: 'Enter a username...',
    QUIZ_TITLE: 'e.g. 2020s Pop Bangers',
    QUIZ_DESCRIPTION: 'e.g. Guess the artist and fill in the missing lyrics...',
  },
});
