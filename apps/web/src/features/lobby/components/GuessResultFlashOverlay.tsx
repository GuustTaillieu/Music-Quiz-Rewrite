import { Check, X } from 'lucide-react';

interface GuessResultFlashOverlayProps {
  isCorrect: boolean;
  message?: string;
}

export function GuessResultFlashOverlay({ isCorrect, message }: GuessResultFlashOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center text-center animate-fade-in pointer-events-none ${
        isCorrect ? 'bg-emerald-950/90' : 'bg-rose-950/90'
      }`}
    >
      <div
        className={`p-6 rounded-full border-4 mb-4 ${
          isCorrect
            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_50px_rgba(52,211,153,0.5)]'
            : 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)]'
        }`}
      >
        {isCorrect ? <Check size={64} strokeWidth={3} /> : <X size={64} strokeWidth={3} />}
      </div>

      <h2
        className={`text-5xl font-black uppercase tracking-wider mb-2 ${
          isCorrect ? 'text-emerald-400' : 'text-rose-500'
        }`}
      >
        {isCorrect ? 'CORRECT GUESS!' : 'WRONG GUESS!'}
      </h2>

      {message && <p className="text-sm font-bold text-white max-w-md">{message}</p>}
    </div>
  );
}
