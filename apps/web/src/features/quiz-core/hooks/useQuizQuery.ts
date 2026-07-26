import { useQuery } from '@tanstack/react-query';
import { quizQueryOptions } from '../options/quiz-query-options';

export function useQuizQuery(quizId: string) {
  return useQuery(quizQueryOptions(quizId));
}
