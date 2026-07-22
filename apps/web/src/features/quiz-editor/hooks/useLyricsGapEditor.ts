import { useState, useEffect } from 'react';
import { editorService } from '../api/editorService';
import { EDITOR_CONSTANTS } from '../constants/editorConstants';

export interface LineToken {
  text: string;
  isMasked: boolean;
}

export interface Line {
  tokens: LineToken[];
}

export function useLyricsGapEditor(
  value: string,
  onChange: (compiled: string) => void,
  artist: string,
  title: string,
) {
  const [lyricsText, setLyricsText] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [isEditingRaw, setIsEditingRaw] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchedLines, setFetchedLines] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<Record<number, boolean>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);

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
      setFetchError(EDITOR_CONSTANTS.ERRORS.MISSING_METADATA);
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchedLines([]);
    setSelectedLines({});

    try {
      const plainLyrics = await editorService.fetchLyrics(artist, title);
      if (!plainLyrics) {
        throw new Error(EDITOR_CONSTANTS.ERRORS.NO_LYRICS_FOUND);
      }

      const parsed = plainLyrics
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

  return {
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
  };
}
