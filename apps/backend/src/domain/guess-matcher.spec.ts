import { GuessMatcher } from './guess-matcher';
import { QuestionType, QuizSong } from '@spotify-music-quiz/shared/schema/game';

describe('GuessMatcher', () => {
  describe('Artist Splitting & Matching', () => {
    it('splits multiple artists delimited by comma, feat, ft, &, etc.', () => {
      const song: QuizSong = {
        id: '1',
        spotifyTrackId: 't1',
        track: {
          id: 't1',
          title: 'Waka Waka',
          artist: 'Shakira, Freshlyground',
          coverArtUrl: '',
        },
        questionType: QuestionType.ARTIST_NAME,
        start_offset_ms: 0,
        end_offset_ms: 30000,
      };

      expect(GuessMatcher.isGuessAccepted(song, 'Shakira')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'Freshlyground')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'shakira, freshlyground')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'Madonna')).toBe(false);
    });

    it('handles "feat." and "&" artist strings', () => {
      const song: QuizSong = {
        id: '2',
        spotifyTrackId: 't2',
        track: {
          id: 't2',
          title: 'Love The Way You Lie',
          artist: 'Eminem feat. Rihanna',
          coverArtUrl: '',
        },
        questionType: QuestionType.ARTIST_NAME,
        start_offset_ms: 0,
        end_offset_ms: 30000,
      };

      expect(GuessMatcher.isGuessAccepted(song, 'eminem')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'Rihanna')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'Eminem & Rihanna')).toBe(true);
    });
  });

  describe('Track Name & Typo Tolerance', () => {
    it('matches phonetic and whitespace variations like "Sk8er Boi" and "skater boy"', () => {
      const song: QuizSong = {
        id: '3',
        spotifyTrackId: 't3',
        track: {
          id: 't3',
          title: 'Sk8er Boi',
          artist: 'Avril Lavigne',
          coverArtUrl: '',
        },
        questionType: QuestionType.TRACK_NAME,
        start_offset_ms: 0,
        end_offset_ms: 30000,
        acceptedTitles: ['Skater Boy'],
      };

      expect(GuessMatcher.isGuessAccepted(song, 'sk8er boi')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'skater boy')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'skaterboy')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'sk8erboy')).toBe(true);
    });

    it('tolerates small typos in long titles and "the" prefixes', () => {
      const song: QuizSong = {
        id: '4',
        spotifyTrackId: 't4',
        track: {
          id: 't4',
          title: 'The Scientist',
          artist: 'Coldplay',
          coverArtUrl: '',
        },
        questionType: QuestionType.TRACK_NAME,
        start_offset_ms: 0,
        end_offset_ms: 30000,
      };

      expect(GuessMatcher.isGuessAccepted(song, 'The Scientist')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'scientist')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'the scientst')).toBe(true); // 1 typo
    });
  });

  describe('Lyrics Gap Matching', () => {
    it('extracts and fuzzy matches square bracketed 1-2 words', () => {
      const song: QuizSong = {
        id: '5',
        spotifyTrackId: 't5',
        track: {
          id: 't5',
          title: 'Wonderwall',
          artist: 'Oasis',
          coverArtUrl: '',
        },
        questionType: QuestionType.FILL_IN_THE_GAP,
        lyricsGap: 'Because maybe, you\'re gonna be the one that [saves me]',
        start_offset_ms: 0,
        end_offset_ms: 30000,
      };

      const extracted = GuessMatcher.extractLyricsGapTarget(song.lyricsGap!);
      expect(extracted.target).toBe('saves me');
      expect(extracted.wordCount).toBe(2);

      expect(GuessMatcher.isGuessAccepted(song, 'saves me')).toBe(true);
      expect(GuessMatcher.isGuessAccepted(song, 'save me')).toBe(true); // minor typo
      expect(GuessMatcher.isGuessAccepted(song, 'savesme')).toBe(true); // space collapsed
      expect(GuessMatcher.isGuessAccepted(song, 'kills me')).toBe(false);
    });

    it('extracts curly bracketed words as well', () => {
      const song: QuizSong = {
        id: '6',
        spotifyTrackId: 't6',
        track: {
          id: 't6',
          title: 'Hello',
          artist: 'Adele',
          coverArtUrl: '',
        },
        questionType: QuestionType.FILL_IN_THE_GAP,
        lyricsGap: 'Hello, it\'s {me}',
        start_offset_ms: 0,
        end_offset_ms: 30000,
      };

      expect(GuessMatcher.isGuessAccepted(song, 'me')).toBe(true);
    });
  });
});
