import { createFileRoute } from '@tanstack/react-router';
import { QuizEditorPage } from '#/features/quiz-editor/components/QuizEditorPage';

export const Route = createFileRoute('/studio/$quizId')({
  component: QuizEditorRouteComponent,
});

function QuizEditorRouteComponent() {
  const { quizId } = Route.useParams();
  return <QuizEditorPage quizId={quizId} />;
}
