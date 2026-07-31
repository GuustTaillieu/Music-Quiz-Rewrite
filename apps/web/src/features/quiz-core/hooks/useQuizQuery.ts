import { useQuery } from '@tanstack/react-query';
import { quizQueryOptions } from '../options/quiz-options';

export function useQuizQuery(quizId: string) {
  return useQuery(quizQueryOptions(quizId));
}
