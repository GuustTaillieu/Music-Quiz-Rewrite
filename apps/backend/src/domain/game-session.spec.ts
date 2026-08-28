import { GameSession } from './game-session';
import { GameMode, GamePhase, Quiz, RoundState } from '@spotify-music-quiz/shared/schema/game';

describe('GameSession State Machine & Gameplay Rules', () => {
  let mockQuiz: Quiz;

  beforeEach(() => {
    mockQuiz = {
      id: 'd3b07384-d113-4ec2-a5d6-c0cf47690bc4',
      title: 'Pop Anthems',
      description: 'Test Quiz description',
      creatorId: 'host-user-123',
      createdAt: new Date().toISOString(),
      songs: [
        {
          spotifyTrackId: 'track-1',
          track: {
            id: 'track-1',
            title: 'Blinding Lights',
            artist: 'The Weeknd',
            album: 'After Hours',
            coverArtUrl: 'https://example.com/cover1.jpg',
            previewUrl: 'https://example.com/preview1.mp3',
          },
          questionType: 'TRACK_NAME',
          start_offset_ms: 0,
          end_offset_ms: 30000,
        },
        {
          spotifyTrackId: 'track-2',
          track: {
            id: 'track-2',
            title: 'Levitating',
            artist: 'Dua Lipa',
            album: 'Future Nostalgia',
            coverArtUrl: 'https://example.com/cover2.jpg',
            previewUrl: 'https://example.com/preview2.mp3',
          },
          questionType: 'ARTIST_NAME',
          start_offset_ms: 5000,
          end_offset_ms: 25000,
        },
        {
          spotifyTrackId: 'track-3',
          track: {
            id: 'track-3',
            title: 'Someone Like You',
            artist: 'Adele',
            album: '21',
            coverArtUrl: 'https://example.com/cover3.jpg',
            previewUrl: 'https://example.com/preview3.mp3',
          },
          questionType: 'FILL_IN_THE_GAP',
          start_offset_ms: 10000,
          end_offset_ms: 40000,
          lyricsGap: 'Never mind, I\'ll find',
        },
      ],
    };
  });

  describe('Lobby Management', () => {
    it('should add players successfully and assign host state', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');

      expect(session.players).toHaveLength(2);
      expect(session.players[0].isHost).toBe(true);
      expect(session.players[1].isHost).toBe(false);
    });

    it('should throw an error for empty names or duplicate names in the same lobby', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.addPlayer('host-id', 'Alice');

      expect(() => session.addPlayer('guest-1', '  ')).toThrow('Name cannot be empty');
      expect(() => session.addPlayer('guest-2', 'alice')).toThrow(
        'Username "alice" is already taken in this lobby',
      );
    });

    it('should remove player completely in Lobby phase', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');

      session.removePlayer('guest-1');
      expect(session.players).toHaveLength(1);
      expect(session.players[0].id).toBe('host-id');
    });

    it('should reconnect existing player with matching playerSessionToken without duplicate entry', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('token-guest-1', 'Bob');

      expect(session.players).toHaveLength(2);

      // Reconnect with same token
      session.addPlayer('token-guest-1', 'Bob Updated');
      expect(session.players).toHaveLength(2);
      expect(session.players[1].name).toBe('Bob Updated');
      expect(session.players[1].isDisconnected).toBe(false);
    });
  });

  describe('Gameplay Starts', () => {
    it('should only allow the host to start the game and default to SPEED_ROUND', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');

      expect(() => session.start('guest-1')).toThrow('Only the host can start the quiz');
      expect(() => session.start('host-id')).not.toThrow();
      expect(session.phase).toBe(GamePhase.SPEED_ROUND);
    });

    it('should initialize turn order and set the first active player when configured to TURN_BASED', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.configure(GameMode.TURN_BASED, 30);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');
      session.start('host-id');

      expect(session.phase).toBe(GamePhase.TURN_BASED);
      expect(session.turnOrder).toEqual(['guest-1', 'guest-2']);
      expect(session.activePlayerId).toBe('guest-1');
    });
  });

  describe('Turn-Based Mode Guesses and Turns passing', () => {
    let session: GameSession;

    beforeEach(() => {
      const longerMockQuiz: Quiz = {
        ...mockQuiz,
        songs: [
          ...mockQuiz.songs,
          {
            spotifyTrackId: 'track-4',
            track: {
              id: 'track-4',
              title: 'Shape of You',
              artist: 'Ed Sheeran',
              album: 'Divide',
              coverArtUrl: 'https://example.com/cover4.jpg',
              previewUrl: 'https://example.com/preview4.mp3',
            },
            questionType: 'TRACK_NAME',
            start_offset_ms: 0,
            end_offset_ms: 30000,
          },
          {
            spotifyTrackId: 'track-5',
            track: {
              id: 'track-5',
              title: 'Bad Guy',
              artist: 'Billie Eilish',
              album: 'When We All Fall Asleep',
              coverArtUrl: 'https://example.com/cover5.jpg',
              previewUrl: 'https://example.com/preview5.mp3',
            },
            questionType: 'ARTIST_NAME',
            start_offset_ms: 0,
            end_offset_ms: 30000,
          },
        ],
      };
      session = new GameSession('ABCD', 'host-id', longerMockQuiz);
      session.configure(GameMode.TURN_BASED, 30);
      session.addPlayer('host-id', 'Alice'); // host-id
      session.addPlayer('guest-1', 'Bob'); // guest-1
      session.addPlayer('guest-2', 'Charlie'); // guest-2
      session.addPlayer('guest-3', 'Daisy'); // guest-3
      session.start('host-id');
    });

    it('should not allow non-active player to submit guess', () => {
      expect(() => session.submitGuess('guest-2', 'Incorrect')).toThrow(
        'It is not your turn to guess',
      );
    });

    it('should award point if guess matches any custom accepted title variation', () => {
      const quizWithAccepted: Quiz = {
        ...mockQuiz,
        songs: [
          {
            spotifyTrackId: 'track-accepted',
            track: {
              id: 'track-accepted',
              title: 'Blue (Da Ba Dee)',
              artist: 'Eiffel 65',
              album: 'Europop',
              coverArtUrl: 'https://example.com/cover.jpg',
            },
            questionType: 'TRACK_NAME',
            start_offset_ms: 0,
            end_offset_ms: 30000,
            acceptedTitles: ['blue', 'daba dee', 'blue dabadee'],
          },
        ],
      };
      const customSession = new GameSession('EFGH', 'host-id', quizWithAccepted);
      customSession.configure(GameMode.TURN_BASED, 30);
      customSession.addPlayer('host-id', 'Alice');
      customSession.addPlayer('guest-1', 'Bob');
      customSession.addPlayer('guest-2', 'Charlie');
      customSession.start('host-id');

      const isCorrect = customSession.submitGuess('guest-1', 'daba dee');
      expect(isCorrect).toBe(true);
      expect(customSession.players.find((p) => p.id === 'guest-1')?.score).toBe(1);
    });

    it('should award points on correct guess and proceed to next song/turn', () => {
      // First song is TRACK_NAME: 'Blinding Lights'
      const isCorrect = session.submitGuess('guest-1', '  blinding lights  ');
      expect(isCorrect).toBe(true);
      expect(session.roundState).toBe(RoundState.REVEALED);

      // Bob score should be 1
      const bob = session.players.find((p) => p.id === 'guest-1');
      expect(bob?.score).toBe(1);

      // Host advances the round
      session.advanceRound('host-id');

      // Moves to next song (Index 1) and rotates active player to Charlie
      expect(session.currentSongIndex).toBe(1);
      expect(session.activePlayerId).toBe('guest-2');
    });

    it('should rotate turn to next player on wrong guess or passing', () => {
      // Song 0: Bob guesses wrong
      const isCorrect = session.submitGuess('guest-1', 'wrong title');
      expect(isCorrect).toBe(false);

      // Should record Bob's wrong guess, and pass to Charlie (guest-2)
      expect(session.playersGuessed).toContain('guest-1');
      expect(session.activePlayerId).toBe('guest-2');

      // Charlie passes
      session.passTurn('guest-2');
      expect(session.playersPassed).toContain('guest-2');

      // Now active player is Daisy (guest-3)
      expect(session.activePlayerId).toBe('guest-3');
    });

    it('should move to next song when everyone passes or guesses wrong', () => {
      // Song 0:
      // Bob guesses wrong
      session.submitGuess('guest-1', 'wrong');
      // Charlie passes
      session.passTurn('guest-2');
      // Daisy passes
      session.passTurn('guest-3');

      // Should transition to reveal state
      expect(session.roundState).toBe(RoundState.REVEALED);

      // Host advances the round
      session.advanceRound('host-id');

      // Should automatically transition to next song because everyone is done
      expect(session.currentSongIndex).toBe(1);
      // Active player for song 1 should be Charlie (next in turnOrder from Bob starter)
      expect(session.activePlayerId).toBe('guest-2');
    });
  });

  describe('Turn-Based Mode Rotation Across Songs', () => {
    it('should stay in TURN_BASED mode and rotate turn starters sequentially on every song', () => {
      // 2 active players (Bob, Charlie), 3 songs total.
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');
      session.configure(GameMode.TURN_BASED, 30);
      session.start('host-id');

      expect(session.phase).toBe(GamePhase.TURN_BASED);
      expect(session.activePlayerId).toBe('guest-1');

      // Song 0: Bob starts and guesses correctly
      session.submitGuess('guest-1', 'Blinding Lights');
      session.advanceRound('host-id');

      // Song 1: Charlie must start now (even though Bob guessed correctly previously)
      expect(session.phase).toBe(GamePhase.TURN_BASED);
      expect(session.activePlayerId).toBe('guest-2');

      // Song 1: Charlie passes, Bob answers correctly
      session.passTurn('guest-2');
      expect(session.activePlayerId).toBe('guest-1');
      session.submitGuess('guest-1', 'Dua Lipa');
      session.advanceRound('host-id');

      // Song 2: Bob must start next in rotation
      expect(session.phase).toBe(GamePhase.TURN_BASED);
      expect(session.activePlayerId).toBe('guest-1');
    });

    it('should strictly rotate starters for 3 players across multiple songs regardless of intra-round actions', () => {
      // 3 active players (Bob, Charlie, Daisy), 4 songs quiz
      const fourSongQuiz = {
        ...mockQuiz,
        songs: [
          ...mockQuiz.songs,
          {
            spotifyTrackId: 'track-4',
            track: {
              id: 'track-4',
              title: 'Levitating',
              artist: 'Dua Lipa',
              album: 'Future Nostalgia',
              coverArtUrl: 'https://example.com/cover4.jpg',
            },
            questionType: 'TRACK_NAME',
            start_offset_ms: 0,
            end_offset_ms: 30000,
          },
        ],
      };

      const session = new GameSession('ABCD', 'host-id', fourSongQuiz);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');
      session.addPlayer('guest-3', 'Daisy');
      session.configure(GameMode.TURN_BASED, 30);
      session.start('host-id');

      // Song 0: Starter is Bob (guest-1)
      expect(session.activePlayerId).toBe('guest-1');
      session.submitGuess('guest-1', 'Blinding Lights'); // Correct
      session.advanceRound('host-id');

      // Song 1: Starter MUST be Charlie (guest-2)
      expect(session.activePlayerId).toBe('guest-2');
      session.submitGuess('guest-2', 'Wrong Answer'); // Wrong -> rotates to Daisy
      expect(session.activePlayerId).toBe('guest-3');
      session.passTurn('guest-3'); // Pass -> rotates to Bob
      expect(session.activePlayerId).toBe('guest-1');
      session.submitGuess('guest-1', 'Dua Lipa'); // Correct
      session.advanceRound('host-id');

      // Song 2: Starter MUST be Daisy (guest-3)
      expect(session.activePlayerId).toBe('guest-3');
      session.passTurn('guest-3'); // Pass -> rotates to Bob
      expect(session.activePlayerId).toBe('guest-1');
      session.passTurn('guest-1'); // Pass -> rotates to Charlie
      expect(session.activePlayerId).toBe('guest-2');
      session.submitGuess('guest-2', 'Save Your Tears'); // Correct
      session.advanceRound('host-id');

      // Song 3: Starter MUST loop back to Bob (guest-1)
      expect(session.activePlayerId).toBe('guest-1');
    });

    it('should allow anyone to guess in SPEED_ROUND, awarding point to first correct player', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.configure(GameMode.SPEED_MODE, 30);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');
      session.addPlayer('guest-3', 'Daisy');
      session.start('host-id');

      expect(session.phase).toBe(GamePhase.SPEED_ROUND);

      // Song 0 is TRACK_NAME: 'Blinding Lights'
      // Bob (guest-1) guesses incorrectly
      const guessBob = session.submitGuess('guest-1', 'Wrong Title');
      expect(guessBob).toBe(false);

      // Charlie (guest-2) guesses correctly
      const guessCharlie = session.submitGuess('guest-2', 'Blinding Lights');
      expect(guessCharlie).toBe(true);
      expect(session.players.find((p) => p.id === 'guest-2')?.score).toBe(1);

      // Advance to song 1
      session.advanceRound('host-id');
      expect(session.currentSongIndex).toBe(1);
    });

    it('should lock out players who guessed wrong in Speed Round, moving next if all guess wrong', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.configure(GameMode.SPEED_MODE, 30);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');
      session.addPlayer('guest-3', 'Daisy');
      session.start('host-id');

      expect(session.phase).toBe(GamePhase.SPEED_ROUND);

      session.submitGuess('guest-1', 'Wrong 1');
      expect(() => session.submitGuess('guest-1', 'Blinding Lights')).toThrow(
        'You have already guessed for this song',
      );

      // Guess wrong by all remaining active players
      session.submitGuess('guest-2', 'Wrong 2');
      session.submitGuess('guest-3', 'Wrong 3');
      expect(session.roundState).toBe(RoundState.REVEALED);

      // Advance round
      session.advanceRound('host-id');

      // All 3 guessed incorrectly, game moves to song 1
      expect(session.currentSongIndex).toBe(1);
      expect(session.phase).toBe(GamePhase.SPEED_ROUND);
    });

    it('should transition to COMPLETED when all songs are spent', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.configure(GameMode.SPEED_MODE, 30);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');
      session.addPlayer('guest-3', 'Daisy');
      session.start('host-id');

      // Song 0: solved
      session.submitGuess('guest-1', 'Blinding Lights');
      session.advanceRound('host-id');

      // Song 1: solved
      session.submitGuess('guest-2', 'Dua Lipa');
      session.advanceRound('host-id');

      // Song 2: solved (FILL_IN_THE_GAP: "Never mind, I'll find")
      session.submitGuess('guest-3', "Never mind, I'll find");
      session.advanceRound('host-id');

      expect(session.phase).toBe(GamePhase.COMPLETED);
      expect(session.activePlayerId).toBeNull();
    });
  });

  describe('Anti-Cheating State Serialization', () => {
    it('should sanitize active song details based on question type', () => {
      const session = new GameSession('ABCD', 'host-id', mockQuiz);
      session.addPlayer('host-id', 'Alice');
      session.addPlayer('guest-1', 'Bob');
      session.addPlayer('guest-2', 'Charlie');
      session.start('host-id');

      // Current Song 0: questionType === 'TRACK_NAME', title === 'Blinding Lights'
      let state = session.getSanitizedState('guest-1');
      expect(state.activeSong).not.toBeNull();
      expect(state.activeSong?.title).toBeNull(); // Title hidden
      expect(state.activeSong?.artist).toBe('The Weeknd'); // Artist visible

      // Correctly guess to move to song 1 (ARTIST_NAME)
      session.submitGuess('guest-1', 'Blinding Lights');
      session.advanceRound('host-id');

      // Current Song 1: questionType === 'ARTIST_NAME', artist === 'Dua Lipa'
      state = session.getSanitizedState('guest-1');
      expect(state.activeSong?.title).toBe('Levitating'); // Title visible
      expect(state.activeSong?.artist).toBeNull(); // Artist hidden
    });
  });
});
