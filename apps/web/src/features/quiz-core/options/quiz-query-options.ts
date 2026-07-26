import { queryOptions } from '@tanstack/react-query';
import { quizApi } from '../api/quizApi';

export const quizQueryOptions = (quizId: string) =>
    queryOptions({
        queryKey: ['quiz', quizId],
        queryFn: () => quizApi.fetchQuiz(quizId),
        enabled: Boolean(quizId),
    });