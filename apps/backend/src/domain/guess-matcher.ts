import type { QuizSong } from '@spotify-music-quiz/shared/schema/game';
import { QuestionType } from '@spotify-music-quiz/shared/schema/game';

/**
 * Robust string normalization and fuzzy matching engine for music quiz guesses.
 */
export class GuessMatcher {
  /**
   * Normalizes a string by converting to lowercase, removing diacritics/accents,
   * converting phonetic/slang forms, stripping non-alphanumeric punctuation, and collapsing whitespace.
   */
  public static normalize(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      // Remove diacritics/accents (e.g. Beyoncé -> Beyonce, café -> cafe)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Strip punctuation and special characters
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"“”‘’[\]{}|\\]/g, ' ')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Cleans artist strings by removing common connecting words like "feat", "ft", "and", "&", "with".
   */
  public static normalizeArtistName(text: string): string {
    return this.normalize(text)
      .replace(/\b(?:feat|ft|featuring|and|with|x|vs)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Splits multi-artist strings (e.g. "Shakira, Freshlyground", "Eminem feat. Rihanna")
   * into individual artists and combinations.
   */
  public static splitArtists(artistString: string): string[] {
    if (!artistString) return [];
    const results = new Set<string>();

    const rawTrimmed = artistString.trim();
    if (rawTrimmed) {
      results.add(rawTrimmed);
    }

    // Split on common delimiters: feat., ft., &, ,, and, with, x, vs., /
    const parts = rawTrimmed.split(
      /\s+(?:feat\.?|ft\.?|featuring|and|with|x|vs\.?|\/|&)\s+|[,&/]\s*/i,
    );

    for (const part of parts) {
      const cleanPart = part.trim();
      if (cleanPart.length > 0) {
        results.add(cleanPart);
      }
    }

    return Array.from(results);
  }

  /**
   * Extracts the target missing phrase from a lyrics gap line.
   * Supports both `[word]` and `{word}` bracket notations.
   */
  public static extractLyricsGapTarget(lyricsGap: string): {
    target: string;
    wordCount: number;
    cleanLyrics: string;
  } {
    if (!lyricsGap) {
      return { target: '', wordCount: 0, cleanLyrics: '' };
    }

    // Match [target] or {target}
    const matches = [...lyricsGap.matchAll(/[\[\{]([^\]\}]+)[\]\}]/g)].map((m) => m[1].trim());

    if (matches.length > 0) {
      const target = matches.join(' ');
      const wordCount = target.split(/\s+/).filter(Boolean).length;
      const cleanLyrics = lyricsGap.replace(/[\[\{]([^\]\}]+)[\]\}]/g, '_____');
      return { target, wordCount, cleanLyrics };
    }

    const fallbackTrimmed = lyricsGap.trim();
    return {
      target: fallbackTrimmed,
      wordCount: fallbackTrimmed.split(/\s+/).filter(Boolean).length,
      cleanLyrics: fallbackTrimmed,
    };
  }

  /**
   * Calculates Levenshtein edit distance between two strings.
   */
  public static levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Compares a candidate correct answer with a user guess using multi-level matching.
   */
  public static isFuzzyMatch(candidate: string, guess: string, isArtist = false): boolean {
    const candNorm = isArtist ? this.normalizeArtistName(candidate) : this.normalize(candidate);
    const guessNorm = isArtist ? this.normalizeArtistName(guess) : this.normalize(guess);

    if (!candNorm || !guessNorm) return false;

    // 1. Direct normalized match
    if (candNorm === guessNorm) return true;

    // 2. Whitespace-collapsed match (e.g. "skaterboy" === "skater boy")
    const candCompact = candNorm.replace(/\s+/g, '');
    const guessCompact = guessNorm.replace(/\s+/g, '');
    if (candCompact === guessCompact) return true;

    // 3. Leading "the" tolerance (e.g. "beatles" matches "the beatles")
    const candNoThe = candNorm.replace(/^the\s+/, '');
    const guessNoThe = guessNorm.replace(/^the\s+/, '');
    if (candNoThe === guessNoThe) return true;
    if (candNoThe.replace(/\s+/g, '') === guessNoThe.replace(/\s+/g, '')) return true;

    // 4. Typo tolerance based on candidate length
    const maxLen = Math.max(candNorm.length, guessNorm.length);
    const distance = this.levenshteinDistance(candNorm, guessNorm);

    if (maxLen <= 3) {
      return distance === 0;
    } else if (maxLen <= 7) {
      return distance <= 1;
    } else if (maxLen <= 14) {
      return distance <= 2;
    } else {
      // For longer phrases (e.g. 15+ chars), allow up to 3 typos or >= 85% similarity
      const similarity = 1 - distance / maxLen;
      return distance <= 3 || similarity >= 0.85;
    }
  }

  /**
   * Evaluates if a submitted guess matches any of the song's acceptable answers.
   */
  public static isGuessAccepted(song: QuizSong, guess: string): boolean {
    if (!guess || !guess.trim()) return false;

    const isArtist = song.questionType === QuestionType.ARTIST_NAME;
    const candidateAnswers: string[] = [];

    switch (song.questionType) {
      case QuestionType.TRACK_NAME: {
        candidateAnswers.push(song.track.title);
        if (song.acceptedTitles && song.acceptedTitles.length > 0) {
          candidateAnswers.push(...song.acceptedTitles);
        }
        break;
      }
      case QuestionType.ARTIST_NAME: {
        const rawArtist = song.track.artist || '';
        candidateAnswers.push(...this.splitArtists(rawArtist));
        if (song.acceptedArtists && song.acceptedArtists.length > 0) {
          for (const accepted of song.acceptedArtists) {
            candidateAnswers.push(...this.splitArtists(accepted));
          }
        }
        break;
      }
      case QuestionType.FILL_IN_THE_GAP: {
        const extracted = this.extractLyricsGapTarget(song.lyricsGap || '');
        if (extracted.target) {
          candidateAnswers.push(extracted.target);
        }
        if (song.acceptedLyricsGaps && song.acceptedLyricsGaps.length > 0) {
          candidateAnswers.push(...song.acceptedLyricsGaps);
        }
        break;
      }
    }

    return candidateAnswers.some((candidate) => this.isFuzzyMatch(candidate, guess, isArtist));
  }
}
