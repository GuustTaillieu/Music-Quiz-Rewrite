import { Test, TestingModule } from '@nestjs/testing';
import { QuizzesService } from './quizzes.service';
import { QuizRepository } from '../ports/quiz.repository.port';

describe('QuizzesService', () => {
  let service: QuizzesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        {
          provide: QuizRepository,
          useValue: {
            findById: jest.fn(),
            findAllMeta: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
