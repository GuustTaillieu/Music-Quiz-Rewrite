import { useState, useEffect } from 'react';

interface Token {
  text: string;
  isMasked: boolean;
}

interface Line {
  tokens: Token[];
}

interface LyricsGapEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

export function LyricsGapEditor({ value, onChange }: LyricsGapEditorProps) {
  const [lyricsText, setLyricsText] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [isEditingRaw, setIsEditingRaw] = useState(false);

  // Sync value from parent
  useEffect(() => {
    // If we have parent value, populate state
    if (value) {
      // Re-create formatting for local editor if not editing raw
      if (!isEditingRaw) {
        setLyricsText(value.replace(/\[|\]/g, ''));
        setLines(parseLyricsToLines(value));
      }
    } else {
      if (!isEditingRaw) {
        setLyricsText('');
        setLines([]);
      }
    }
  }, [value, isEditingRaw]);

  const parseLyricsToLines = (rawText: string): Line[] => {
    if (!rawText) return [];
    const textLines = rawText.split('\n');
    return textLines.map((lineText) => {
      // Regex splits by bracketed groups OR individual words
      const regex = /(\[[^\]]+\]|[^\s]+)/g;
      const matches = lineText.match(regex) || [];
      const tokens = matches.map((token) => {
        const isMasked = token.startsWith('[') && token.endsWith(']');
        const text = isMasked ? token.slice(1, -1) : token;
        return { text, isMasked };
      });
      return { tokens };
    });
  };

  const handleTextareaChange = (e: string) => {
    setLyricsText(e);
    const parsedLines = parseLyricsToLines(e);
    setLines(parsedLines);
    // Propagate plain text initially
    onChange(e);
  };

  const toggleWordMask = (lineIndex: number, tokenIndex: number) => {
    const updatedLines = [...lines];
    const token = updatedLines[lineIndex].tokens[tokenIndex];
    token.isMasked = !token.isMasked;
    setLines(updatedLines);

    // Compile back to bracketed string
    const compiled = updatedLines
      .map((line) =>
        line.tokens
          .map((t) => (t.isMasked ? `[${t.text}]` : t.text))
          .join(' '),
      )
      .join('\n');
    onChange(compiled);
  };

  const clearAllGaps = () => {
    const updatedLines = lines.map((line) => ({
      tokens: line.tokens.map((t) => ({ ...t, isMasked: false })),
    }));
    setLines(updatedLines);
    onChange(lyricsText);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-pink-400">
          Lyrics Editor & Gaps
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditingRaw(!isEditingRaw)}
            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer"
          >
            {isEditingRaw ? 'View Gaps Builder' : 'Edit Raw Lyrics'}
          </button>
          {lines.some((l) => l.tokens.some((t) => t.isMasked)) && (
            <button
              type="button"
              onClick={clearAllGaps}
              className="text-[10px] font-bold text-rose-500 hover:underline focus:outline-none cursor-pointer"
            >
              Clear All Gaps
            </button>
          )}
        </div>
      </div>

      {isEditingRaw || lines.length === 0 ? (
        <div className="space-y-2">
          <textarea
            placeholder="Paste song lyrics here..."
            value={lyricsText}
            onChange={(e) => handleTextareaChange(e.target.value)}
            rows={8}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] placeholder:text-cyan-500/20 font-mono leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground">
            Paste lyrics, then switch back to "View Gaps Builder" to click and hide words.
          </p>
        </div>
      ) : (
        <div className="border border-cyan-500/20 rounded-2xl bg-black/40 p-4 max-h-[320px] overflow-y-auto space-y-2 font-mono leading-relaxed text-sm">
          {lines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex flex-wrap gap-x-1.5 min-h-[1.5rem]">
              {line.tokens.length === 0 ? (
                <span className="opacity-0">&nbsp;</span>
              ) : (
                line.tokens.map((token, tokenIdx) => (
                  <span
                    key={tokenIdx}
                    onClick={() => toggleWordMask(lineIdx, tokenIdx)}
                    className={`cursor-pointer px-1 rounded transition-colors select-none ${
                      token.isMasked
                        ? 'bg-[#00f0ff] text-black font-bold border-b border-[#00f0ff] shadow-sm'
                        : 'hover:bg-white/10 text-foreground/80'
                    }`}
                  >
                    {token.text}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {lines.length > 0 && !isEditingRaw && (
        <div className="text-[10px] text-muted-foreground/60 leading-normal flex items-start gap-1">
          <span className="text-cyan-400 font-bold">Tip:</span>
          <span>Click on any word to hide it. Gapped words will turn cyan and show as blanks in gameplay.</span>
        </div>
      )}
    </div>
  );
}
