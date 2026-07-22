import { createFileRoute } from '@tanstack/react-router';
import { StudioIndexView } from '#/features/quiz-editor/components/StudioIndexView';

export const Route = createFileRoute('/studio/')({
  component: StudioIndexView,
});
