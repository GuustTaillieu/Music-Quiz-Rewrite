import { Test, TestingModule } from '@nestjs/testing';
import { AiQuizService } from './ai-quiz.service';
import { DATABASE_CONNECTION } from '../infrastructure/database/database.constants';
import { SpotifyTokenService } from '../infrastructure/spotify/spotify-token.service';
import { SpotifyService } from '../spotify/spotify.service';
import { QuizzesService } from '../quizzes/quizzes.service';

describe('AiQuizService', () => {
  let service: AiQuizService;

  const mockDb = {
    query: {
      user: {
        findFirst: jest.fn(),
      },
      account: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(true),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(true),
    }),
  };

  const mockTokenService = {
    getHostAccessToken: jest.fn().mockResolvedValue('mock_spotify_token'),
  };

  const mockSpotifyService = {
    search: jest.fn(),
    getLyrics: jest.fn(),
  };

  const mockQuizzesService = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiQuizService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: SpotifyTokenService,
          useValue: mockTokenService,
        },
        {
          provide: SpotifyService,
          useValue: mockSpotifyService,
        },
        {
          provide: QuizzesService,
          useValue: mockQuizzesService,
        },
      ],
    }).compile();

    service = module.get<AiQuizService>(AiQuizService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserAiProfile', () => {
    it('should return profile with masked key, credits, and google link status', async () => {
      mockDb.query.user.findFirst.mockResolvedValueOnce({
        id: 'user_123',
        aiCredits: 4,
        customGeminiApiKey: 'AIzaSySecretApiKey12345',
      });
      mockDb.query.account.findFirst.mockResolvedValueOnce(null);

      const profile = await service.getUserAiProfile('user_123');
      expect(profile).toEqual({
        aiCredits: 4,
        hasCustomKey: true,
        customKeyMasked: 'AIza...2345',
        isGoogleLinked: false,
        googleEmail: null,
      });
    });

    it('should return isGoogleLinked true when google account linked', async () => {
      mockDb.query.user.findFirst.mockResolvedValueOnce({
        id: 'user_123',
        aiCredits: 5,
        customGeminiApiKey: null,
      });
      mockDb.query.account.findFirst.mockResolvedValueOnce({
        id: 'acc_1',
        providerId: 'google',
        idToken: 'token',
      });

      const profile = await service.getUserAiProfile('user_123');
      expect(profile).toEqual({
        aiCredits: 5,
        hasCustomKey: false,
        customKeyMasked: null,
        isGoogleLinked: true,
        googleEmail: 'Connected',
      });
    });

    it('should return default profile if user not found', async () => {
      mockDb.query.user.findFirst.mockResolvedValueOnce(null);
      mockDb.query.account.findFirst.mockResolvedValueOnce(null);

      const profile = await service.getUserAiProfile('user_none');
      expect(profile).toEqual({
        aiCredits: 0,
        hasCustomKey: false,
        customKeyMasked: null,
        isGoogleLinked: false,
        googleEmail: null,
      });
    });
  });

  describe('setCustomApiKey', () => {
    it('should update user custom key and return updated profile', async () => {
      mockDb.query.user.findFirst.mockResolvedValueOnce({
        id: 'user_123',
        aiCredits: 5,
        customGeminiApiKey: 'AIzaNewKey99999',
      });
      mockDb.query.account.findFirst.mockResolvedValueOnce(null);

      const result = await service.setCustomApiKey('user_123', 'AIzaNewKey99999');
      expect(result.hasCustomKey).toBe(true);
      expect(result.customKeyMasked).toBe('AIza...9999');
    });
  });
});
