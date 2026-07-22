import { Disc } from 'lucide-react';

interface GetReadyOverlayProps {
  countdownSecs: number;
}

export function GetReadyOverlay({ countdownSecs }: GetReadyOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[#00f0ff] mb-4 animate-bounce">
        <Disc size={48} />
      </div>
      <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-2">
        Get Ready!
      </h2>
      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-6">
        Next song snippet starting in...
      </p>

      <div className="text-8xl font-black font-mono text-[#00f0ff] animate-ping shadow-2xl">
        {countdownSecs}
      </div>
    </div>
  );
}
