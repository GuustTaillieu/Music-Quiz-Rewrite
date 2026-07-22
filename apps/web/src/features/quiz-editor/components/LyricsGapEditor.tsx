import { Loader2, Music, Check, Sparkles } from 'lucide-react';
import { useLyricsGapEditor } from '../hooks/useLyricsGapEditor';
import { Button } from '#/features/shared/components/ui/button';

interface LyricsGapEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  artist?: string;
  title?: string;
}

export function LyricsGapEditor({ value, onChange, artist = '', title = '' }: LyricsGapEditorProps) {
  const {
    lyricsText,
    lines,
    isEditingRaw,
    setIsEditingRaw,
    isFetching,
    fetchedLines,
    selectedLines,
    fetchError,
    showSearchPanel,
    setShowSearchPanel,
    handleTextareaChange,
    toggleWordMask,
    clearAllGaps,
    handleFetchLyrics,
    toggleLineSelection,
    handleImportLyrics,
  } = useLyricsGapEditor(value, onChange, artist, title);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase tracking-wider text-pink-400">
          Lyrics & Gap Builder
        </label>
        <div className="flex gap-3 items-center">
          <Button
            type="button"
            variant="cyan"
            size="sm"
            disabled={isFetching}
            onClick={handleFetchLyrics}
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
          </Button>

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

      {showSearchPanel && fetchedLines.length > 0 && (
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-2xl space-y-3 text-left animate-fade-in">
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
                  // ...
                }}
                className="text-[9px] font-bold text-cyan-400 hover:underline"
              >
                All
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSearchPanel(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleImportLyrics}
            >
              Import Selected
            </Button>
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
