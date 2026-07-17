import { useRouter } from '@tanstack/react-router';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export function RouteErrorComponent({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="min-h-screen py-12 flex flex-col items-center justify-center px-4">
      <div className="island-shell p-8 rounded-3xl text-center max-w-md w-full border-destructive/20 relative overflow-hidden">
        <div className="inline-flex p-3.5 bg-destructive/10 text-destructive rounded-2xl mb-4">
          <AlertCircle size={36} />
        </div>
        <h2 className="display-title text-2xl font-black text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.invalidate()}
            className="flex-1 bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw size={16} /> Retry
          </button>
          <a
            href="/"
            className="flex-1 bg-foam/15 hover:bg-foam/25 border border-line text-foreground font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-sm text-center"
          >
            <Home size={16} /> Home
          </a>
        </div>
      </div>
    </div>
  );
}
