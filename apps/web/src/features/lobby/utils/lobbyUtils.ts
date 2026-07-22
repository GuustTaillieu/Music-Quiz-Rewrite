export interface GapBlock {
  id: number;
  wordCount: number;
  placeholder: string;
}

export const formatTime = (ms: number | null | undefined): string => {
  if (!ms) return '0:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseGapBlocks = (lyrics: string | null | undefined): GapBlock[] => {
  if (!lyrics) return [];

  const blocks: GapBlock[] = [];
  const lines = lyrics.split('\n');
  let blockCounter = 0;

  lines.forEach((line) => {
    const tokens = line.split(/\s+/);
    let inGapSequence = false;
    let currentWords = 0;

    tokens.forEach((token) => {
      const isGap = token.startsWith('[') && token.endsWith(']');
      if (isGap) {
        if (!inGapSequence) {
          inGapSequence = true;
          currentWords = 1;
        } else {
          currentWords++;
        }
      } else {
        if (inGapSequence) {
          blocks.push({
            id: blockCounter++,
            wordCount: currentWords,
            placeholder: Array(currentWords).fill('_').join(' '),
          });
          inGapSequence = false;
          currentWords = 0;
        }
      }
    });

    if (currentWords > 0) {
      blocks.push({
        id: blockCounter++,
        wordCount: currentWords,
        placeholder: Array(currentWords).fill('_').join(' '),
      });
    }
  });

  return blocks;
};
