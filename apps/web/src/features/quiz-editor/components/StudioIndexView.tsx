import { useNavigate } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';

export function StudioIndexView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-12 flex flex-col items-center justify-center px-4 bg-[#05070f] text-white">
      <div className="island-shell p-8 rounded-3xl text-center max-w-md w-full border-line relative overflow-hidden bg-black/60 border border-cyan-500/20 backdrop-blur-xl">
        <div className="inline-flex p-3.5 bg-cyan-500/10 text-cyan-400 rounded-2xl mb-4">
          <Pencil size={36} />
        </div>
        <h2 className="display-title text-2xl font-black text-white mb-2">Quiz Studio</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Select or create a quiz from your host dashboard to enter the editor.
        </p>

        <button
          onClick={() => navigate({ to: '/' })}
          className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] text-black font-black uppercase tracking-wider py-3 px-6 rounded-xl cursor-pointer text-xs"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
