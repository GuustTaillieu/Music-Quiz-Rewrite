import { useQuery } from '@tanstack/react-query';
import { quizzesQueryOptions } from '../options/quizzes-options';

export function useQuizzesQuery() {
  return useQuery(quizzesQueryOptions());
}
