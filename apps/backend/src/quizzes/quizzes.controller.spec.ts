import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

// Mock the NestJS better auth library to avoid ESM parsing issues in Jest
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  Session: () => jest.fn(),
}));

describe('QuizzesController', () => {
  let controller: QuizzesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [
        {
          provide: QuizzesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QuizzesController>(QuizzesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
