import { useQuery } from '@tanstack/react-query';
import { quizApi } from '../api/quizApi';

export function useQuizzesQuery() {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: quizApi.fetchQuizzes,
  });
}
