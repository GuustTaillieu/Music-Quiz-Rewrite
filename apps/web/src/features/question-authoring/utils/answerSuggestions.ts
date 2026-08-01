export function generateAnswerSuggestions(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const trimmed = rawText.trim();
  const suggestions: string[] = [trimmed];

  const lower = trimmed.toLowerCase();
  if (lower !== trimmed) {
    suggestions.push(lower);
  }

  const hasSpecialChars = /[\(\)\[\]\{\}:;\-\/\.,?!_]/g.test(trimmed);

  if (hasSpecialChars) {
    const noParens = trimmed.replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, '').trim();
    if (noParens && noParens !== trimmed) {
      suggestions.push(noParens);
      const noParensLower = noParens.toLowerCase();
      if (noParensLower !== noParens) {
        suggestions.push(noParensLower);
      }
    }

    const parenMatches = [...trimmed.matchAll(/\(([^)]+)\)|\[([^\]]+)\]|\{([^}]+)\}/g)];
    for (const match of parenMatches) {
      const inner = (match[1] || match[2] || match[3] || '').trim();
      if (inner && inner.length > 1) {
        suggestions.push(inner);
        const innerLower = inner.toLowerCase();
        if (innerLower !== inner) {
          suggestions.push(innerLower);
        }
      }
    }

    const cleanNoPunctuation = trimmed
      .replace(/[\(\)\[\]\{\}:;\-\/\.,?!_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanNoPunctuation) {
      suggestions.push(cleanNoPunctuation);
      const cleanLower = cleanNoPunctuation.toLowerCase();
      if (cleanLower !== cleanNoPunctuation) {
        suggestions.push(cleanLower);
      }
    }
  }

  return Array.from(new Set(suggestions.map((s) => s.trim()).filter((s) => s.length > 0)));
}
