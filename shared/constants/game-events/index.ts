export const GAME_EVENTS = Object.freeze({
    JOIN_LOBBY: 'join_lobby',
    JOIN_SUCCESS: 'join_success',
    JOIN_ERROR: 'join_error',
    GAME_START: 'game_start',
    GAME_STATE_UPDATE: 'game_state_update',
    ERROR: 'error',
    SUBMIT_GUESS: 'submit_guess',
    GUESS_RESULT: 'guess_result',
    PASS_TURN: 'pass_turn',
    NEXT_SONG: 'next_song',
    CONFIGURE_LOBBY: 'configure_lobby',
    FORCE_REVEAL: 'force_reveal',
    END_GAME: 'end_game',
    HOST_AUDIO_STARTED: 'host_audio_started',
});

export type GameEvent = typeof GAME_EVENTS[keyof typeof GAME_EVENTS];