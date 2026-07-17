import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { QuizRepository } from '../ports/quiz.repository.port';
import { GameSessionRepository } from '../ports/game-session.repository.port';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: QuizRepository,
          useValue: {
            findById: jest.fn(),
            findAllMeta: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: GameSessionRepository,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
