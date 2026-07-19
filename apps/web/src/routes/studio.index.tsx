import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/studio/')({
  component: StudioIndex,
});

function StudioIndex() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate({ to: '/' });
  }, [navigate]);

  return null;
}
