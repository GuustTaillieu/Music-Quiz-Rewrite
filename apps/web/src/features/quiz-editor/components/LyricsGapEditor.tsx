import { useState, useEffect } from 'react';
import { Loader2, Music, Check, Sparkles } from 'lucide-react';
import { apiFetch } from '#/features/shared/api/client';

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
  artist?: string;
  title?: string;
}

export function LyricsGapEditor({ value, onChange, artist = '', title = '' }: LyricsGapEditorProps) {
  const [lyricsText, setLyricsText] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [isEditingRaw, setIsEditingRaw] = useState(false);

  // LRCLIB Fetch States
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedLines, setFetchedLines] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<Record<number, boolean>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  // Sync value from parent
  useEffect(() => {
    if (value) {
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
    onChange(e);
  };

  const toggleWordMask = (lineIndex: number, tokenIndex: number) => {
    const updatedLines = [...lines];
    const token = updatedLines[lineIndex].tokens[tokenIndex];
    token.isMasked = !token.isMasked;
    setLines(updatedLines);

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

  const handleFetchLyrics = async () => {
    if (!title.trim() || !artist.trim()) {
      setFetchError('Missing artist or track title metadata.');
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchedLines([]);
    setSelectedLines({});

    try {
      const { data, error } = await apiFetch<{ plainLyrics: string | null }>(
        `/spotify/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
      );

      if (error || !data.plainLyrics) {
        throw new Error('No lyrics found for this track.');
      }

      const lyricsRaw = data.plainLyrics;
      const parsed = lyricsRaw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      setFetchedLines(parsed);
      const defaultSelected: Record<number, boolean> = {};
      parsed.forEach((_, idx) => {
        defaultSelected[idx] = false;
      });
      setSelectedLines(defaultSelected);
      setShowSearchPanel(true);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown search failure.');
    } finally {
      setIsFetching(false);
    }
  };

  const toggleLineSelection = (idx: number) => {
    setSelectedLines((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleImportLyrics = () => {
    const selected = fetchedLines
      .filter((_, idx) => selectedLines[idx])
      .join('\n');

    setLyricsText(selected);
    const parsedLines = parseLyricsToLines(selected);
    setLines(parsedLines);
    onChange(selected);

    setShowSearchPanel(false);
    setFetchedLines([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase tracking-wider text-pink-400">
          Lyrics & Gap Builder
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isFetching}
            onClick={handleFetchLyrics}
            className="text-[10px] font-black text-[#00f0ff] hover:underline focus:outline-none cursor-pointer flex items-center gap-1 uppercase tracking-wider"
          >
            {isFetching ? (
              <>
                <Loader2 size={10} className="animate-spin" /> Fetching...
              </>
            ) : (
              <>
                <Music size={10} /> Find Lyrics
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsEditingRaw(!isEditingRaw)}
            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 focus:outline-none cursor-pointer uppercase tracking-wider"
          >
            {isEditingRaw ? 'View Gaps' : 'Edit Plain'}
          </button>
          {lines.some((l) => l.tokens.some((t) => t.isMasked)) && (
            <button
              type="button"
              onClick={clearAllGaps}
              className="text-[10px] font-bold text-rose-500 hover:underline focus:outline-none cursor-pointer uppercase tracking-wider"
            >
              Clear Gaps
            </button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-normal">
          {fetchError}
        </div>
      )}

      {/* LRCLIB Import Panel */}
      {showSearchPanel && fetchedLines.length > 0 && (
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-2xl space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Sparkles size={11} /> Select lyrics to import ({fetchedLines.filter((_, idx) => selectedLines[idx]).length} lines)
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const all: Record<number, boolean> = {};
                  fetchedLines.forEach((_, i) => { all[i] = true; });
                  setSelectedLines(all);
                }}
                className="text-[9px] font-bold text-cyan-400 hover:underline"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedLines({})}
                className="text-[9px] font-bold text-cyan-400 hover:underline"
              >
                None
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-cyan-500/10 bg-black/30 rounded-xl p-2 font-mono text-xs leading-relaxed space-y-1.5">
            {fetchedLines.map((line, idx) => {
              const isSel = !!selectedLines[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleLineSelection(idx)}
                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSel ? 'bg-cyan-500/10 text-white font-semibold' : 'text-muted-foreground hover:bg-white/5'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSel ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-cyan-500/30'
                    }`}
                  >
                    {isSel && <Check size={10} strokeWidth={3} />}
                  </div>
                  <span className="select-none">{line}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowSearchPanel(false)}
              className="text-[10px] font-bold text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg border border-cyan-500/10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportLyrics}
              className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#00f0ff] to-[#00a8cc] text-black px-4 py-2 rounded-xl active:scale-95 cursor-pointer transition-all"
            >
              Import Selected
            </button>
          </div>
        </div>
      )}

      {isEditingRaw || lines.length === 0 ? (
        <div className="space-y-2">
          <textarea
            placeholder="Search lyrics above or paste here..."
            value={lyricsText}
            onChange={(e) => handleTextareaChange(e.target.value)}
            rows={6}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] placeholder:text-cyan-500/15 font-mono leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground">
            Type lyrics, then switch to "View Gaps" to click and hide words.
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
