import { queryOptions } from '@tanstack/react-query';
import { quizApi } from '../api/quizApi';

export const quizzesQueryOptions = () =>
    queryOptions({
        queryKey: ['quizzes'],
        queryFn: quizApi.fetchQuizzes
    });