export interface GapBlock {
  id: number;
  wordCount: number;
  answers: string[];
}

export function parseGapBlocks(lyrics?: string | null): GapBlock[] {
  if (!lyrics) return [];
  // Match either [word] or {word}
  const matches = lyrics.match(/[\[\{](.*?)[\]\}]/g) || [];
  return matches.map((match, id) => {
    const content = match.slice(1, -1).trim();
    const words = content.split(/\s+/).filter(Boolean);
    return {
      id,
      wordCount: words.length || 1,
      answers: words,
    };
  });
}
