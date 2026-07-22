import { queryOptions } from '@tanstack/react-query';
import { dashboardService } from './dashboardService';
import { DASHBOARD_CONSTANTS } from '../constants/dashboardConstants';

export const dashboardQueries = {
  quizzes: (enabled: boolean) =>
    queryOptions({
      queryKey: ['quizzes'],
      queryFn: () => dashboardService.fetchQuizzes(),
      enabled,
    }),

  activeSessions: (enabled: boolean) =>
    queryOptions({
      queryKey: ['active-sessions'],
      queryFn: () => dashboardService.fetchActiveSessions(),
      enabled,
      refetchInterval: DASHBOARD_CONSTANTS.REFETCH_INTERVAL_MS,
    }),
};
