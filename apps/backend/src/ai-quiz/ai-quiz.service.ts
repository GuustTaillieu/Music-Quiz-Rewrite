import {
  Injectable,
  Inject,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION, type DrizzleDb } from '../infrastructure/database/database.constants';
import { user } from '../infrastructure/database/schema';
import { SpotifyTokenService } from '../infrastructure/spotify/spotify-token.service';
import { SpotifyService } from '../spotify/spotify.service';
import { QuizzesService } from '../quizzes/quizzes.service';
import {
  GenerateQuizPayload,
  SuggestSongsPayload,
  UserAiProfile,
  Quiz,
  QuizSong,
  QuestionType,
} from '@spotify-music-quiz/shared/schema/game';

@Injectable()
export class AiQuizService {
  private readonly logger = new Logger(AiQuizService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDb,
    private readonly tokenService: SpotifyTokenService,
    private readonly spotifyService: SpotifyService,
    private readonly quizzesService: QuizzesService,
  ) { }

  public async getUserAiProfile(userId: string): Promise<UserAiProfile> {
    const dbUser = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!dbUser) {
      return {
        aiCredits: 0,
        hasCustomKey: false,
        customKeyMasked: null,
      };
    }

    let customKeyMasked: string | null = null;
    if (dbUser.customGeminiApiKey) {
      const key = dbUser.customGeminiApiKey;
      customKeyMasked =
        key.length > 8
          ? `${key.slice(0, 4)}...${key.slice(-4)}`
          : '****';
    }

    return {
      aiCredits: dbUser.aiCredits ?? 0,
      hasCustomKey: Boolean(dbUser.customGeminiApiKey),
      customKeyMasked,
    };
  }

  public async setCustomApiKey(userId: string, apiKey: string | null): Promise<UserAiProfile> {
    const cleanKey = apiKey ? apiKey.trim() : null;
    await this.db
      .update(user)
      .set({ customGeminiApiKey: cleanKey })
      .where(eq(user.id, userId));

    return this.getUserAiProfile(userId);
  }

  public async generateQuiz(
    userId: string,
    payload: GenerateQuizPayload,
  ): Promise<{ quiz: Quiz; targetMode: 'INSTANT_PLAY' | 'STUDIO' }> {
    const { apiKey, isCustomKey } = await this.resolveApiKey(userId);
    const hostToken = await this.tokenService.getHostAccessToken(userId);

    const ai = new GoogleGenAI({ apiKey });

    try {
      this.logger.log(`Generating AI Quiz for user ${userId} with prompt: "${payload.prompt}"`);

      // 1. Ask Gemini to curate a list of candidate songs based on the prompt & tags
      const systemInstruction = `You are an elite music quiz producer. Create an entertaining, high-energy music quiz based on the user's prompt and restriction tags.
Select famous, recognizable, and fun tracks that fit the theme perfectly.
Output a valid JSON object matching the requested schema.`;

      const userPrompt = `Quiz Theme: "${payload.prompt}"
Number of Tracks: ${payload.trackCount}
Tags & Restrictions: ${payload.tags.length > 0 ? payload.tags.join(', ') : 'None'}

Please choose ${payload.trackCount} distinct songs. For each song, provide the track title, artist name, and a suggested question type:
- TRACK_NAME: Players guess the song title
- ARTIST_NAME: Players guess the artist
- FILL_IN_THE_GAP: Players fill in missing words in a memorable lyric line`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: { type: Type.STRING, description: 'Creative and catchy title for the quiz' },
              quizDescription: { type: Type.STRING, description: 'Short description summarizing the theme' },
              tracks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    searchQuery: { type: Type.STRING, description: 'Clean search query "Track Title Artist"' },
                    title: { type: Type.STRING },
                    artist: { type: Type.STRING },
                    questionType: {
                      type: Type.STRING,
                      enum: ['TRACK_NAME', 'ARTIST_NAME', 'FILL_IN_THE_GAP'],
                    },
                    lyricsSnippet: {
                      type: Type.STRING,
                      description: 'If FILL_IN_THE_GAP, write 1-2 lines of famous lyrics with words to guess enclosed in [brackets], e.g. "I want it [that way]"',
                    },
                  },
                  required: ['searchQuery', 'title', 'artist', 'questionType'],
                },
              },
            },
            required: ['quizTitle', 'quizDescription', 'tracks'],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? '{}') as {
        quizTitle?: string;
        quizDescription?: string;
        tracks?: Array<{
          searchQuery: string;
          title: string;
          artist: string;
          questionType: string;
          lyricsSnippet?: string;
        }>;
      };

      if (!parsed.tracks || parsed.tracks.length === 0) {
        throw new Error('AI failed to generate tracks for the requested prompt.');
      }

      // 2. Validate tracks against Spotify Web API
      const validQuizSongs: QuizSong[] = [];

      for (const trackSuggestion of parsed.tracks) {
        if (validQuizSongs.length >= payload.trackCount) break;

        const searchResults = await this.spotifyService.search(
          hostToken,
          trackSuggestion.searchQuery || `${trackSuggestion.title} ${trackSuggestion.artist}`,
        );

        if (searchResults.length === 0) {
          continue;
        }

        const matchedTrack = searchResults[0];
        const duration = matchedTrack.durationMs ?? 180000;

        // Default snippet: 30s to 60s, or 1/4 of track if short
        let startMs = Math.min(30000, Math.floor(duration * 0.25));
        let endMs = Math.min(duration, startMs + 30000);

        let qType = trackSuggestion.questionType as QuestionType;
        let lyricsGap: string | null = null;

        // If FILL_IN_THE_GAP requested, check lyrics
        if (qType === QuestionType.FILL_IN_THE_GAP) {
          const lyricsResult = await this.spotifyService.getLyrics(
            matchedTrack.artist,
            matchedTrack.title,
          );

          if (trackSuggestion.lyricsSnippet && trackSuggestion.lyricsSnippet.includes('[')) {
            lyricsGap = trackSuggestion.lyricsSnippet;
          } else if (lyricsResult.plainLyrics) {
            // Find a punchy line from plain lyrics and mask 1 key word
            const lines = lyricsResult.plainLyrics.split('\n').filter((l) => l.trim().length > 10);
            if (lines.length > 0) {
              const selectedLine = lines[Math.floor(lines.length / 3)] || lines[0];
              const words = selectedLine.split(' ');
              if (words.length >= 3) {
                const targetWordIdx = Math.floor(words.length / 2);
                words[targetWordIdx] = `[${words[targetWordIdx].replace(/[^a-zA-Z0-9]/g, '')}]`;
                lyricsGap = words.join(' ');
              }
            }
          }

          if (!lyricsGap) {
            // Fallback to TRACK_NAME if no lyrics found
            qType = QuestionType.TRACK_NAME;
          }
        }

        validQuizSongs.push({
          id: randomUUID(),
          spotifyTrackId: matchedTrack.id,
          track: matchedTrack,
          questionType: qType,
          start_offset_ms: startMs,
          end_offset_ms: endMs,
          lyricsGap: lyricsGap ?? undefined,
          acceptedTitles: [matchedTrack.title],
          acceptedArtists: [matchedTrack.artist],
        });
      }

      if (validQuizSongs.length === 0) {
        throw new Error('Could not find matching Spotify tracks for the generated songs.');
      }

      // 3. Save Quiz into PostgreSQL database
      const newQuizId = randomUUID();
      const createdQuiz = await this.quizzesService.create({
        id: newQuizId,
        title: parsed.quizTitle || payload.prompt,
        description: parsed.quizDescription || `Generated by AI for prompt: ${payload.prompt}`,
        creatorId: userId,
        isAiGenerated: true,
        songs: validQuizSongs,
      });

      // 4. Decrement credits if platform key was used
      if (!isCustomKey) {
        await this.decrementCredits(userId);
      }

      return {
        quiz: createdQuiz,
        targetMode: payload.targetMode,
      };
    } catch (err: unknown) {
      this.handleAiError(err, isCustomKey);
    }
  }

  public async suggestSongs(
    userId: string,
    payload: SuggestSongsPayload,
  ): Promise<QuizSong[]> {
    const { apiKey, isCustomKey } = await this.resolveApiKey(userId);
    const hostToken = await this.tokenService.getHostAccessToken(userId);
    const existingQuiz = await this.quizzesService.findOne(payload.quizId);

    const ai = new GoogleGenAI({ apiKey });

    try {
      const existingTitles = existingQuiz.songs
        .map((s) => `"${s.track.title}" by ${s.track.artist}`)
        .join(', ');

      const systemInstruction = `You are an expert music assistant. Recommend songs that match the style and theme of an existing music quiz.`;

      const prompt = `Current Quiz: "${existingQuiz.title}" (${existingQuiz.description ?? ''})
Existing tracks in quiz: ${existingTitles}
User Request: "${payload.prompt}"
Please suggest ${payload.count} new, distinct songs that complement this quiz.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                searchQuery: { type: Type.STRING },
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                questionType: {
                  type: Type.STRING,
                  enum: ['TRACK_NAME', 'ARTIST_NAME'],
                },
              },
              required: ['searchQuery', 'title', 'artist', 'questionType'],
            },
          },
        },
      });

      const suggestions = JSON.parse(response.text ?? '[]') as Array<{
        searchQuery: string;
        title: string;
        artist: string;
        questionType: string;
      }>;

      const newSongs: QuizSong[] = [];

      for (const item of suggestions) {
        const searchResults = await this.spotifyService.search(
          hostToken,
          item.searchQuery || `${item.title} ${item.artist}`,
        );

        if (searchResults.length > 0) {
          const track = searchResults[0];
          const duration = track.durationMs ?? 180000;
          const startMs = Math.min(30000, Math.floor(duration * 0.25));

          newSongs.push({
            id: randomUUID(),
            spotifyTrackId: track.id,
            track,
            questionType: item.questionType as QuestionType,
            start_offset_ms: startMs,
            end_offset_ms: Math.min(duration, startMs + 30000),
            acceptedTitles: [track.title],
            acceptedArtists: [track.artist],
          });
        }
      }

      return newSongs;
    } catch (err: unknown) {
      this.handleAiError(err, isCustomKey);
    }
  }

  private async resolveApiKey(userId: string): Promise<{ apiKey: string; isCustomKey: boolean }> {
    const dbUser = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (dbUser?.customGeminiApiKey?.trim()) {
      return { apiKey: dbUser.customGeminiApiKey.trim(), isCustomKey: true };
    }

    const platformKey = process.env.GEMINI_API_KEY?.trim();
    if (!platformKey) {
      throw new BadRequestException(
        'Gemini API key is not configured on the server. Please provide your personal Gemini API key in settings.',
      );
    }

    const credits = dbUser?.aiCredits ?? 0;
    if (credits <= 0) {
      throw new HttpException(
        {
          message:
            'You have used all your free AI quiz generation credits. Please connect your personal Gemini API key in account settings for unlimited generations.',
          code: 'INSUFFICIENT_CREDITS',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return { apiKey: platformKey, isCustomKey: false };
  }

  private async decrementCredits(userId: string): Promise<void> {
    const dbUser = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (dbUser && (dbUser.aiCredits ?? 0) > 0) {
      await this.db
        .update(user)
        .set({ aiCredits: (dbUser.aiCredits ?? 1) - 1 })
        .where(eq(user.id, userId));
    }
  }

  private handleAiError(err: unknown, isCustomKey: boolean): never {
    const message = err instanceof Error ? err.message : String(err);
    this.logger.error(`AI Quiz Generation error: ${message}`, err);

    if (
      message.includes('429') ||
      message.includes('RESOURCE_EXHAUSTED') ||
      message.toLowerCase().includes('quota')
    ) {
      throw new HttpException(
        {
          message: isCustomKey
            ? 'Your personal Gemini API key has exceeded its quota limit. Please check your Google AI Studio account or try again in a few moments.'
            : 'Platform AI generation quota is currently busy. Please wait a moment or connect your personal Gemini API key in settings.',
          code: 'QUOTA_EXCEEDED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (err instanceof HttpException) {
      throw err;
    }

    throw new BadRequestException(message || 'Failed to generate AI quiz');
  }
}
