import { Home, HelpCircle } from 'lucide-react';

export function RouteNotFoundComponent() {
  return (
    <div className="min-h-screen py-12 flex flex-col items-center justify-center px-4">
      <div className="island-shell p-8 rounded-3xl text-center max-w-md w-full border-line relative overflow-hidden">
        {/* Spinner decoration */}
        <div className="inline-flex p-3.5 bg-lagoon/10 text-lagoon-deep rounded-2xl mb-4 animate-bounce">
          <HelpCircle size={36} />
        </div>
        <h2 className="display-title text-4xl font-black text-foreground mb-2">
          404
        </h2>
        <h3 className="font-bold text-foreground text-lg mb-2">
          Page Not Found
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          The page you are looking for does not exist, has been moved, or is temporarily unavailable.
        </p>

        <a
          href="/"
          className="w-full bg-gradient-to-r from-lagoon to-lagoon-deep text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-sm"
        >
          <Home size={16} /> Go Back Home
        </a>
      </div>
    </div>
  );
}
