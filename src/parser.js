function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .trim();
}

export function parseMapTapMessage(text) {
  const cleaned = normalizeText(text);
  if (!cleaned) return null;

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) return null;

  const finalLineIndex = lines.findIndex((line) => /^Final score\s*:/i.test(line));
  if (finalLineIndex === -1) return null;

  const finalMatch = lines[finalLineIndex].match(/^Final score\s*:\s*(\d{1,5})\s*$/i);
  if (!finalMatch) return null;
  const finalScore = Number(finalMatch[1]);

  const scoreLineIndex = finalLineIndex - 1;
  if (scoreLineIndex < 0) return null;
  const roundLine = lines[scoreLineIndex];
  const roundScores = [...roundLine.matchAll(/(\d{1,3})/g)].map((m) => Number(m[1]));
  if (roundScores.length !== 5) return null;

  const dateLines = lines.slice(0, scoreLineIndex);
  if (dateLines.length === 0) return null;
  const gameDateText = dateLines.join(' ');

  return {
    gameDateText,
    roundScores,
    finalScore,
    rawText: cleaned
  };
}
