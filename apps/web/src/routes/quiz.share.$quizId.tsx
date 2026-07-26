import { createFileRoute, redirect } from '@tanstack/react-router';
import { SharedQuizPreview } from '#/features/quiz-forking';
import { quizQueryOptions } from '#/features/quiz-core';

export const Route = createFileRoute('/quiz/share/$quizId')({
  component: ShareQuizRouteComponent,
  beforeLoad: async ({ context: { queryClient }, params: { quizId } }) => {
    if (!quizId) {
      throw redirect({ to: '/' });
    }
    await queryClient.prefetchQuery(quizQueryOptions(quizId))
  },
});

function ShareQuizRouteComponent() {
  const { quizId } = Route.useParams();
  return <SharedQuizPreview quizId={quizId} />;
}
