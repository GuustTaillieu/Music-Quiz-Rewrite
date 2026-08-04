import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';
import { SpotifyTokenService } from '../infrastructure/spotify/spotify-token.service';

// Mock the NestJS better auth library to avoid ESM parsing issues in Jest
jest.mock(
  '@thallesp/nestjs-better-auth',
  () => ({
    AuthGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
    Session: () => jest.fn(),
  }),
  { virtual: true },
);

describe('SpotifyController', () => {
  let controller: SpotifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpotifyController],
      providers: [
        {
          provide: SpotifyService,
          useValue: {
            search: jest.fn(),
          },
        },
        {
          provide: SpotifyTokenService,
          useValue: {
            getHostAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SpotifyController>(SpotifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
