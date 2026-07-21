import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';

// Mock the NestJS better auth library to avoid ESM parsing issues in Jest
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  Session: () => jest.fn(),
  AllowAnonymous: () => () => {},
}));

describe('GameController', () => {
  let controller: GameController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: {
            createLobby: jest.fn(),
            getLobbyState: jest.fn(),
            startGame: jest.fn(),
            submitGuess: jest.fn(),
            passTurn: jest.fn(),
            removePlayer: jest.fn(),
            addPlayer: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
