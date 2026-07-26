

interface HostLyricsDisplayProps {
  lyrics?: string;
  revealed: boolean;
}

export function HostLyricsDisplay({ lyrics, revealed }: HostLyricsDisplayProps) {
  if (!lyrics) return null;

  return (
    <div className="my-4 p-4 bg-black/40 border border-cyan-500/20 rounded-2xl text-left max-h-48 overflow-y-auto font-mono text-sm leading-relaxed">
      <div className="text-[10px] font-black uppercase tracking-wider text-pink-400 mb-2">
        Lyric Gap Preview:
      </div>
      <div className="whitespace-pre-wrap text-foreground/90">
        {lyrics.split('\n').map((line, lIdx) => (
          <div key={lIdx} className="min-h-[1.5rem]">
            {line.split(/(\[.*?\])/).map((part, pIdx) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                const hiddenWord = part.slice(1, -1);
                return (
                  <span
                    key={pIdx}
                    className={`inline-block px-2 py-0.5 rounded mx-0.5 font-bold transition-all ${
                      revealed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-[#00f0ff] text-black shadow-[0_0_8px_#00f0ff]'
                    }`}
                  >
                    {revealed ? hiddenWord : '____'}
                  </span>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
