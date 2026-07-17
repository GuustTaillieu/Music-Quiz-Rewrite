import {
  GameSessionState,
  Player,
  ActiveSongInfo,
  Quiz,
  GamePhase,
  QuestionType,
} from '@spotify-music-quiz/shared/schema/game';

export class GameSession {
  private _players: Player[] = [];
  private _phase: GamePhase = 'LOBBY';
  private _currentSongIndex = 0;
  private _activePlayerId: string | null = null;
  private _songStarterPlayerId: string | null = null;
  private _turnOrder: string[] = [];
  private _playersGuessed: string[] = [];
  private _playersPassed: string[] = [];

  constructor(
    private readonly _lobbyId: string,
    private readonly _hostId: string,
    private readonly _quiz: Quiz,
  ) {}

  // ============================================================================
  // Getters
  // ============================================================================

  public get lobbyId(): string {
    return this._lobbyId;
  }

  public get hostId(): string {
    return this._hostId;
  }

  public get quiz(): Quiz {
    return this._quiz;
  }

  public get players(): Player[] {
    return [...this._players];
  }

  public get phase(): GamePhase {
    return this._phase;
  }

  public get currentSongIndex(): number {
    return this._currentSongIndex;
  }

  public get activePlayerId(): string | null {
    return this._activePlayerId;
  }

  public get turnOrder(): string[] {
    return [...this._turnOrder];
  }

  public get playersGuessed(): string[] {
    return [...this._playersGuessed];
  }

  public get playersPassed(): string[] {
    return [...this._playersPassed];
  }

  // ============================================================================
  // Mutations
  // ============================================================================

  public addPlayer(id: string, name: string): void {
    if (this._phase !== 'LOBBY') {
      throw new Error('Cannot join a game that has already started');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Name cannot be empty');
    }

    const nameExists = this._players.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (nameExists) {
      throw new Error(`Username "${trimmedName}" is already taken in this lobby`);
    }

    const isHost = id === this._hostId;
    this._players.push({
      id,
      name: trimmedName,
      score: 0,
      isHost,
      isDisconnected: false,
    });
  }

  public removePlayer(id: string): void {
    if (this._phase === 'LOBBY') {
      // Completely remove in lobby phase
      this._players = this._players.filter((p) => p.id !== id);
    } else {
      // Mark as disconnected in gameplay phases
      const player = this._players.find((p) => p.id === id);
      if (player) {
        player.isDisconnected = true;
      }

      // If the active player disconnected, we pass the turn
      if (this._phase === 'TURN_BASED' && this._activePlayerId === id) {
        this.passTurn(id);
      }
    }
  }

  public start(callerId: string): void {
    if (callerId !== this._hostId) {
      throw new Error('Only the host can start the quiz');
    }

    if (this._phase !== 'LOBBY') {
      throw new Error('Quiz has already started');
    }

    if (this._players.length === 0) {
      throw new Error('Cannot start a game with no players');
    }

    if (this._quiz.songs.length === 0) {
      throw new Error('Cannot start a quiz with zero songs');
    }

    // Set order based on player arrival (or we could shuffle, but keeping it predictable)
    this._turnOrder = this._players.map((p) => p.id);
    this._currentSongIndex = 0;
    this._playersGuessed = [];
    this._playersPassed = [];

    // Check if we immediately start in Speed Round (e.g. quiz with very few songs)
    const activeCount = this.getActivePlayersCount();
    if (this._quiz.songs.length < activeCount) {
      this._phase = 'SPEED_ROUND';
      this._activePlayerId = null;
      this._songStarterPlayerId = null;
    } else {
      this._phase = 'TURN_BASED';
      // Pick first non-disconnected player
      this._activePlayerId = this.findNextTurnPlayer(null);
      this._songStarterPlayerId = this._activePlayerId;
    }
  }

  public submitGuess(playerId: string, guess: string): boolean {
    const activeSong = this.getCurrentSong();
    if (!activeSong) {
      throw new Error('No song currently active');
    }

    const player = this._players.find((p) => p.id === playerId);
    if (!player || player.isDisconnected) {
      throw new Error('Player is not active in this session');
    }

    if (this._phase === 'TURN_BASED') {
      if (playerId !== this._activePlayerId) {
        throw new Error('It is not your turn to guess');
      }

      const isCorrect = this.checkAnswer(activeSong, guess);
      if (isCorrect) {
        player.score += 1;
        this.moveToNextSong();
        return true;
      } else {
        this._playersGuessed.push(playerId);
        // On incorrect guess, automatically pass to the next player
        this.rotateTurn();
        return false;
      }
    } else if (this._phase === 'SPEED_ROUND') {
      if (this._playersGuessed.includes(playerId)) {
        throw new Error('You have already guessed for this song');
      }

      const isCorrect = this.checkAnswer(activeSong, guess);
      if (isCorrect) {
        player.score += 1;
        this.moveToNextSong();
        return true;
      } else {
        this._playersGuessed.push(playerId);
        // If everyone has guessed wrong, move to next song
        const activeCount = this.getActivePlayersCount();
        if (this._playersGuessed.length >= activeCount) {
          this.moveToNextSong();
        }
        return false;
      }
    } else {
      throw new Error('Guesses can only be submitted during active gameplay phases');
    }
  }

  public passTurn(playerId: string): void {
    if (this._phase !== 'TURN_BASED') {
      throw new Error('Turns can only be passed in turn-based mode');
    }

    if (playerId !== this._activePlayerId) {
      throw new Error('Only the active player can pass their turn');
    }

    this._playersPassed.push(playerId);
    this.rotateTurn();
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  private getActivePlayersCount(): number {
    return this._players.filter((p) => !p.isDisconnected).length;
  }

  private getCurrentSong() {
    if (this._currentSongIndex < 0 || this._currentSongIndex >= this._quiz.songs.length) {
      return null;
    }
    return this._quiz.songs[this._currentSongIndex];
  }

  private checkAnswer(song: typeof this._quiz.songs[0], guess: string): boolean {
    let answer = '';
    if (song.questionType === 'TRACK_NAME') {
      answer = song.track.title;
    } else if (song.questionType === 'ARTIST_NAME') {
      answer = song.track.artist;
    } else if (song.questionType === 'FILL_IN_THE_GAP') {
      answer = song.lyricsGap || '';
    }

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, '')
        .replace(/\s+/g, ' ');

    return normalize(guess) === normalize(answer);
  }

  private rotateTurn(): void {
    const nextPlayer = this.findNextTurnPlayerForCurrentSong();
    if (nextPlayer) {
      this._activePlayerId = nextPlayer;
    } else {
      // Everyone has either passed or guessed wrong for this song -> move to next song
      this.moveToNextSong();
    }
  }

  private findNextTurnPlayer(currentActive: string | null): string | null {
    const activeCount = this.getActivePlayersCount();
    if (activeCount === 0) return null;

    let startIndex = 0;
    if (currentActive) {
      const idx = this._turnOrder.indexOf(currentActive);
      if (idx !== -1) {
        startIndex = (idx + 1) % this._turnOrder.length;
      }
    }

    for (let i = 0; i < this._turnOrder.length; i++) {
      const checkIdx = (startIndex + i) % this._turnOrder.length;
      const playerId = this._turnOrder[checkIdx];
      const player = this._players.find((p) => p.id === playerId);
      if (player && !player.isDisconnected) {
        return playerId;
      }
    }

    return null;
  }

  private findNextTurnPlayerForCurrentSong(): string | null {
    const activeCount = this.getActivePlayersCount();
    if (activeCount === 0) return null;

    const currentActiveIdx = this._activePlayerId ? this._turnOrder.indexOf(this._activePlayerId) : -1;
    const startIndex = currentActiveIdx !== -1 ? (currentActiveIdx + 1) % this._turnOrder.length : 0;

    for (let i = 0; i < this._turnOrder.length; i++) {
      const checkIdx = (startIndex + i) % this._turnOrder.length;
      const playerId = this._turnOrder[checkIdx];

      const player = this._players.find((p) => p.id === playerId);
      if (player && !player.isDisconnected) {
        // Must not have guessed or passed for this specific song
        const hasGuessed = this._playersGuessed.includes(playerId);
        const hasPassed = this._playersPassed.includes(playerId);
        if (!hasGuessed && !hasPassed) {
          return playerId;
        }
      }
    }

    return null;
  }

  private moveToNextSong(): void {
    this._currentSongIndex += 1;
    this._playersGuessed = [];
    this._playersPassed = [];

    const total = this._quiz.songs.length;
    if (this._currentSongIndex >= total) {
      this._phase = 'COMPLETED';
      this._activePlayerId = null;
      return;
    }

    const remainingSongs = total - this._currentSongIndex;
    const activeCount = this.getActivePlayersCount();

    // SPEED ROUND Transition Check (Unfairness Prevention)
    if (remainingSongs < activeCount) {
      this._phase = 'SPEED_ROUND';
      this._activePlayerId = null;
      this._songStarterPlayerId = null;
    } else {
      // In Turn-Based Mode, select the next active player from the list
      this._phase = 'TURN_BASED';
      this._songStarterPlayerId = this.findNextTurnPlayer(this._songStarterPlayerId);
      this._activePlayerId = this._songStarterPlayerId;
    }
  }

  // ============================================================================
  // Sanitization / External State Serialization
  // ============================================================================

  public getSanitizedState(playerId: string): GameSessionState {
    const currentSong = this.getCurrentSong();
    let sanitizedSong: ActiveSongInfo | null = null;

    if (currentSong) {
      const { track, questionType, start_offset_ms, end_offset_ms, lyricsGap } = currentSong;
      sanitizedSong = {
        spotifyTrackId: currentSong.spotifyTrackId,
        questionType,
        start_offset_ms,
        end_offset_ms,
        lyricsGap: questionType === 'FILL_IN_THE_GAP' ? lyricsGap : null,
        title: questionType === 'TRACK_NAME' ? null : track.title,
        artist: questionType === 'ARTIST_NAME' ? null : track.artist,
        album: track.album,
        coverArtUrl: track.coverArtUrl,
        previewUrl: track.previewUrl,
      };
    }

    return {
      lobbyId: this._lobbyId,
      hostId: this._hostId,
      phase: this._phase,
      players: this.players,
      currentSongIndex: this._currentSongIndex,
      totalSongs: this._quiz.songs.length,
      activePlayerId: this._activePlayerId,
      turnOrder: this.turnOrder,
      playersGuessed: this.playersGuessed,
      playersPassed: this.playersPassed,
      activeSong: sanitizedSong,
    };
  }
}
