import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiQuizApi } from '../api/aiQuizApi';
import type { GenerateQuizPayload, SuggestSongsPayload } from '@spotify-music-quiz/shared/schema/game';

export const AI_QUIZ_KEYS = {
  profile: ['ai-quiz', 'profile'] as const,
};

export function useAiProfile() {
  return useQuery({
    queryKey: AI_QUIZ_KEYS.profile,
    queryFn: () => aiQuizApi.getProfile(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUnlinkGoogleAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => aiQuizApi.unlinkGoogleAccount(),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(AI_QUIZ_KEYS.profile, updatedProfile);
    },
  });
}

export function useSetApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apiKey: string | null) => aiQuizApi.setApiKey(apiKey),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(AI_QUIZ_KEYS.profile, updatedProfile);
    },
  });
}

export function useGenerateAiQuizMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateQuizPayload) => aiQuizApi.generateQuiz(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_QUIZ_KEYS.profile });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}

export function useSuggestTracksMutation() {
  return useMutation({
    mutationFn: (payload: SuggestSongsPayload) => aiQuizApi.suggestTracks(payload),
  });
}
