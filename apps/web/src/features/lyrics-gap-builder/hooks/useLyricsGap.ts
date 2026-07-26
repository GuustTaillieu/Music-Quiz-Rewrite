import { useState, useEffect } from 'react';
import { apiFetch } from '#/features/shared/api/client';

export interface LyricsToken {
  text: string;
  isMasked: boolean;
}

export interface LyricsLine {
  tokens: LyricsToken[];
}

export function useLyricsGap(
  value: string,
  onChange: (newValue: string) => void,
  artist: string = '',
  title: string = ''
) {
  const [lyricsText, setLyricsText] = useState('');
  const [lines, setLines] = useState<LyricsLine[]>([]);
  const [isEditingRaw, setIsEditingRaw] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchedLines, setFetchedLines] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<Record<number, boolean>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  useEffect(() => {
    if (!value) {
      setLyricsText('');
      setLines([]);
      return;
    }

    setLyricsText(value);
    const parsedLines = parseGapSyntaxToLines(value);
    setLines(parsedLines);
  }, [value]);

  const parseGapSyntaxToLines = (syntaxString: string): LyricsLine[] => {
    const rawLines = syntaxString.split('\n');
    return rawLines.map((line) => {
      const tokens: LyricsToken[] = [];
      const regex = /\[(.*?)\]|(\S+)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match[1] !== undefined) {
          tokens.push({ text: match[1], isMasked: true });
        } else if (match[2] !== undefined) {
          tokens.push({ text: match[2], isMasked: false });
        }
      }
      return { tokens };
    });
  };

  const serializeLinesToGapSyntax = (newLines: LyricsLine[]): string => {
    return newLines
      .map((line) =>
        line.tokens
          .map((token) => (token.isMasked ? `[${token.text}]` : token.text))
          .join(' ')
      )
      .join('\n');
  };

  const handleTextareaChange = (newRaw: string) => {
    setLyricsText(newRaw);
    onChange(newRaw);
  };

  const toggleWordMask = (lineIdx: number, tokenIdx: number) => {
    const nextLines = lines.map((l, i) => {
      if (i !== lineIdx) return l;
      const nextTokens = l.tokens.map((t, j) => {
        if (j !== tokenIdx) return t;
        return { ...t, isMasked: !t.isMasked };
      });
      return { ...l, tokens: nextTokens };
    });

    setLines(nextLines);
    const serialized = serializeLinesToGapSyntax(nextLines);
    onChange(serialized);
  };

  const clearAllGaps = () => {
    const nextLines = lines.map((l) => ({
      ...l,
      tokens: l.tokens.map((t) => ({ ...t, isMasked: false })),
    }));
    setLines(nextLines);
    const serialized = serializeLinesToGapSyntax(nextLines);
    onChange(serialized);
  };

  const handleFetchLyrics = async () => {
    if (!title) {
      setFetchError('Missing track title to search lyrics');
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setShowSearchPanel(false);

    try {
      const searchParams = new URLSearchParams({ title, artist });
      const { data, error } = await apiFetch<{ plainLyrics: string | null }>(
        `/spotify/lyrics?${searchParams.toString()}`
      );

      if (error || !data?.plainLyrics) {
        setFetchError('Lyrics not found for this song.');
      } else {
        const rawLines = data.plainLyrics
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        setFetchedLines(rawLines);
        const initialSelection: Record<number, boolean> = {};
        rawLines.forEach((_, idx) => {
          initialSelection[idx] = false;
        });
        setSelectedLines(initialSelection);
        setShowSearchPanel(true);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch lyrics.');
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
    const importedText = fetchedLines
      .filter((_, idx) => selectedLines[idx])
      .join('\n');

    setLyricsText(importedText);
    onChange(importedText);
    setShowSearchPanel(false);
  };

  return {
    lyricsText,
    lines,
    isEditingRaw,
    setIsEditingRaw,
    isFetching,
    fetchedLines,
    selectedLines,
    setSelectedLines,
    fetchError,
    showSearchPanel,
    setShowSearchPanel,
    handleTextareaChange,
    toggleWordMask,
    clearAllGaps,
    handleFetchLyrics,
    toggleLineSelection,
    handleImportLyrics,
  };
}
