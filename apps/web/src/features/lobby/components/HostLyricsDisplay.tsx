interface HostLyricsDisplayProps {
  lyrics?: string;
  revealed: boolean;
}

export function HostLyricsDisplay({ lyrics, revealed }: HostLyricsDisplayProps) {
  if (!lyrics) return null;

  const lines = lyrics.split('\n');

  return (
    <div className="space-y-2 font-mono text-center max-w-lg mx-auto overflow-y-auto max-h-[220px] p-4 bg-black/40 rounded-xl border border-[#00f0ff]/20 leading-relaxed text-xs select-none shadow-inner">
      {lines.map((lineText, lineIdx) => {
        const regex = /(\[[^\]]+\]|[^\s]+)/g;
        const matches = lineText.match(regex);

        return (
          <div key={lineIdx} className="flex flex-wrap justify-center gap-x-1 min-h-[1.2rem]">
            {!matches ? (
              <span className="opacity-0">&nbsp;</span>
            ) : (
              matches.map((token, tokenIdx) => {
                const isMasked = token.startsWith('[') && token.endsWith(']');
                const text = isMasked ? token.slice(1, -1) : token;

                if (isMasked) {
                  return (
                    <span
                      key={tokenIdx}
                      className={`px-1.5 py-0.5 rounded font-black border-b-2 transition-all ${
                        revealed
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 scale-105 animate-pulse'
                          : 'bg-cyan-500/20 text-[#00f0ff] border-[#00f0ff]'
                      }`}
                    >
                      {revealed ? text : '_'.repeat(Math.max(5, text.length))}
                    </span>
                  );
                }

                return (
                  <span key={tokenIdx} className="text-foreground/85">
                    {text}
                  </span>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
