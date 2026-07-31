import { createFileRoute } from '@tanstack/react-router';
import { QuizEditorPage } from '#/features/quiz-studio';

export const Route = createFileRoute('/_authenticated/studio/$quizId')({
  component: QuizEditorRouteComponent,
});

function QuizEditorRouteComponent() {
  const { quizId } = Route.useParams();
  return <QuizEditorPage quizId={quizId} />;
}
