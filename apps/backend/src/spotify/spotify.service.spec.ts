import { Test, TestingModule } from '@nestjs/testing';
import { SpotifyService } from './spotify.service';
import { SpotifyService as SpotifyServicePort } from '../ports/spotify.service.port';

describe('SpotifyService', () => {
  let service: SpotifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotifyService,
        {
          provide: SpotifyServicePort,
          useValue: {
            searchTracks: jest.fn(),
            getTrack: jest.fn(),
            controlPlayback: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SpotifyService>(SpotifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
