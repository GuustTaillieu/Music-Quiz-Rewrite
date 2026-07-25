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
  private _roundState: 'GUESSING' | 'REVEALED' = 'GUESSING';
  private _lastRoundWinnerId: string | null = null;
  private _gameMode: 'SPEED_MODE' | 'TURN_BASED' = 'TURN_BASED';
  private _guessingTimeLimit = 30;
  private _roundEndTime: number | null = null;

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

  public get gameMode(): 'SPEED_MODE' | 'TURN_BASED' {
    return this._gameMode;
  }

  public get guessingTimeLimit(): number {
    return this._guessingTimeLimit;
  }

  public configure(mode: 'SPEED_MODE' | 'TURN_BASED', timeLimit: number): void {
    if (this._phase !== 'LOBBY') {
      throw new Error('Cannot change settings after game starts');
    }
    this._gameMode = mode;
    this._guessingTimeLimit = timeLimit;
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

  public get roundState(): 'GUESSING' | 'REVEALED' {
    return this._roundState;
  }

  public get lastRoundWinnerId(): string | null {
    return this._lastRoundWinnerId;
  }

  // ============================================================================
  // Mutations
  // ============================================================================

  public addPlayer(id: string, name: string, userId?: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Name cannot be empty');
    }

    const existingPlayer = this._players.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingPlayer) {
      existingPlayer.id = id;
      existingPlayer.isDisconnected = false;
      if (userId && userId === this._hostId) {
        existingPlayer.isHost = true;
      }
      return;
    }

    if (this._phase !== 'LOBBY') {
      throw new Error('Cannot join a game that has already started');
    }

    const isHost = id === this._hostId || (userId && userId === this._hostId);
    this._players.push({
      id,
      name: trimmedName,
      score: 0,
      isHost: !!isHost,
      isDisconnected: false,
    });
  }

  public removePlayer(id: string): void {
    if (this._phase === 'LOBBY') {
      // Mark as disconnected in lobby phase so host refresh reconnects cleanly
      const player = this._players.find((p) => p.id === id);
      if (player) {
        player.isDisconnected = true;
      }
    } else {
      // Mark as disconnected in gameplay phases
      const player = this._players.find((p) => p.id === id);
      if (player) {
        player.isDisconnected = true;
      }

      // If active guessers drops below 2, end the game immediately
      const activeCount = this.getActivePlayersCount();
      if (activeCount < 2 && this._phase !== 'COMPLETED') {
        this._phase = 'COMPLETED';
        this._activePlayerId = null;
        this._songStarterPlayerId = null;
        this._roundState = 'REVEALED';
      } else if (this._phase === 'TURN_BASED' && this._activePlayerId === id) {
        // If the active player disconnected, we pass the turn
        this.passTurn(id);
      }
    }
  }

  public start(callerId: string): void {
    const caller = this._players.find((p) => p.id === callerId);
    if (!caller || !caller.isHost) {
      throw new Error('Only the host can start the quiz');
    }

    if (this._phase !== 'LOBBY') {
      throw new Error('Quiz has already started');
    }

    const guestPlayers = this._players.filter((p) => !p.isHost);
    if (guestPlayers.length < 2) {
      throw new Error('Cannot start a game with fewer than 2 players');
    }

    if (this._quiz.songs.length === 0) {
      throw new Error('Cannot start a quiz with zero songs');
    }

    // Set order based on player arrival (excluding host)
    this._turnOrder = guestPlayers.map((p) => p.id);
    this._currentSongIndex = 0;
    this._playersGuessed = [];
    this._playersPassed = [];
    this._roundEndTime = null;

    // Check if SPEED_MODE was selected
    if (this._gameMode === 'SPEED_MODE') {
      this._phase = 'SPEED_ROUND';
      this._activePlayerId = null;
      this._songStarterPlayerId = null;
    } else {
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
  }

  public startAudioTimer(hostId: string): void {
    const caller = this._players.find((p) => p.id === hostId);
    if (!caller || !caller.isHost) {
      throw new Error('Only the host can start the audio timer');
    }
    if (this._roundState !== 'GUESSING') return;

    this.startRoundTimerInternal();
  }

  private startRoundTimerInternal(): void {
    const currentSong = this.getCurrentSong();
    const timeLimitSecs = currentSong
      ? Math.max(30, Math.ceil((currentSong.end_offset_ms - currentSong.start_offset_ms) / 1000))
      : this._guessingTimeLimit;

    this._roundEndTime = Date.now() + timeLimitSecs * 1000;
  }

  public submitGuess(playerId: string, guess: string): boolean {
    if (this._roundState === 'REVEALED') {
      throw new Error('Round is already over. Waiting for next song.');
    }

    if (this._roundEndTime && Date.now() > this._roundEndTime) {
      throw new Error('Time for answering has expired');
    }

    const activeSong = this.getCurrentSong();
    if (!activeSong) {
      throw new Error('No song currently active');
    }

    const player = this._players.find((p) => p.id === playerId);
    if (!player || player.isDisconnected) {
      throw new Error('Player is not active in this session');
    }

    if (player.isHost) {
      throw new Error('Hosts cannot submit guesses');
    }

    if (this._phase === 'TURN_BASED') {
      if (playerId !== this._activePlayerId) {
        throw new Error('It is not your turn to guess');
      }

      const isCorrect = this.checkAnswer(activeSong, guess);
      if (isCorrect) {
        player.score += 1;
        this._roundState = 'REVEALED';
        this._lastRoundWinnerId = playerId;
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
        this._roundState = 'REVEALED';
        this._lastRoundWinnerId = playerId;
        return true;
      } else {
        this._playersGuessed.push(playerId);
        // If everyone has guessed wrong, transition to reveal
        const activeCount = this.getActivePlayersCount();
        if (this._playersGuessed.length >= activeCount) {
          this._roundState = 'REVEALED';
          this._lastRoundWinnerId = null;
        }
        return false;
      }
    } else {
      throw new Error('Guesses can only be submitted during active gameplay phases');
    }
  }

  public passTurn(playerId: string): void {
    const player = this._players.find((p) => p.id === playerId);
    if (player?.isHost) {
      throw new Error('Hosts cannot pass turns');
    }

    if (this._phase !== 'TURN_BASED') {
      throw new Error('Turns can only be passed in turn-based mode');
    }

    if (playerId !== this._activePlayerId) {
      throw new Error('Only the active player can pass their turn');
    }

    this._playersPassed.push(playerId);
    this.rotateTurn();
  }

  public advanceRound(hostId: string): void {
    const caller = this._players.find((p) => p.id === hostId);
    if (!caller || !caller.isHost) {
      throw new Error('Only the host can advance the round');
    }
    if (this._roundState !== 'REVEALED') {
      throw new Error('Cannot advance round while guessing is active');
    }

    this._roundState = 'GUESSING';
    this._lastRoundWinnerId = null;
    this._roundEndTime = null;
    this.moveToNextSong();
  }

  public forceReveal(hostId: string): void {
    const caller = this._players.find((p) => p.id === hostId);
    if (!caller || !caller.isHost) {
      throw new Error('Only the host can force reveal');
    }
    if (this._roundState === 'REVEALED') return;

    this._roundState = 'REVEALED';
    this._lastRoundWinnerId = null;
    this._roundEndTime = null;
  }

  public forceEnd(hostId: string): void {
    const caller = this._players.find((p) => p.id === hostId);
    if (!caller || !caller.isHost) {
      throw new Error('Only the host can end the game');
    }
    this._phase = 'COMPLETED';
    this._activePlayerId = null;
    this._songStarterPlayerId = null;
    this._roundState = 'REVEALED';
    this._roundEndTime = null;
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  private getActivePlayersCount(): number {
    return this._players.filter((p) => !p.isDisconnected && !p.isHost).length;
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
      const rawLyrics = song.lyricsGap || '';
      const matches = [...rawLyrics.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
      answer = matches.length > 0 ? matches.join(' ') : rawLyrics;
    }

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/;/g, ' ')
        .trim()
        .replace(/[.,\/#!$%\^&\*:{}=\-_`~()?'"]/g, '')
        .replace(/\s+/g, ' ');

    return normalize(guess) === normalize(answer);
  }

  private rotateTurn(): void {
    const nextPlayer = this.findNextTurnPlayerForCurrentSong();
    if (nextPlayer) {
      this._activePlayerId = nextPlayer;
    } else {
      // Everyone has either passed or guessed wrong for this song -> transition to reveal
      this._roundState = 'REVEALED';
      this._lastRoundWinnerId = null;
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

    const isHost = playerId === this._hostId;
    const isRevealed = this._roundState === 'REVEALED';

    if (currentSong) {
      const { track, questionType, start_offset_ms, end_offset_ms, lyricsGap } = currentSong;

      let songTitle: string | null = null;
      let songArtist: string | null = null;
      let songAlbum: string | null = null;
      let songCover: string | null = null;
      let songLyrics: string | null = null;

      if (isHost || isRevealed) {
        songTitle = track.title;
        songArtist = track.artist;
        songAlbum = track.album;
        songCover = track.coverArtUrl;
        songLyrics = lyricsGap ?? null;
      } else {
        songTitle = questionType === 'TRACK_NAME' ? null : track.title;
        songArtist = questionType === 'ARTIST_NAME' ? null : track.artist;
        songAlbum = null;
        songCover = null;
        songLyrics = questionType === 'FILL_IN_THE_GAP' ? this.maskLyrics(lyricsGap) : null;
      }

      sanitizedSong = {
        spotifyTrackId: currentSong.spotifyTrackId,
        questionType,
        start_offset_ms,
        end_offset_ms,
        lyricsGap: songLyrics,
        title: songTitle,
        artist: songArtist,
        album: songAlbum,
        coverArtUrl: songCover,
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
      roundState: this._roundState,
      lastRoundWinnerId: this._lastRoundWinnerId,
      gameMode: this._gameMode,
      guessingTimeLimit: currentSong
        ? Math.max(30, Math.ceil((currentSong.end_offset_ms - currentSong.start_offset_ms) / 1000))
        : 30,
      roundEndTime: this._roundState === 'GUESSING' ? this._roundEndTime : null,
    };
  }

  private maskLyrics(lyrics: string | null | undefined): string | null {
    if (!lyrics) return null;
    return lyrics.replace(/\[([^\]]+)\]/g, (match, word) => {
      return `[${'_'.repeat(word.length)}]`;
    });
  }
}
