function normalizeLineEndings(text) {
  return String(text || '').replace(/\r\n/g, '\n').trim();
}

function parseMapTapMessage(text) {
  const normalized = normalizeLineEndings(text);
  if (!normalized) return null;

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) return null;

  const dateLine = lines[0];
  const roundsLine = lines[1];
  const finalLine = lines.find((line) => /^Final score\s*:/i.test(line));

  if (!dateLine || !roundsLine || !finalLine) return null;

  const roundMatches = [...roundsLine.matchAll(/(\d{1,3})/g)].map((match) => Number(match[1]));
  if (roundMatches.length !== 5) return null;

  const finalMatch = finalLine.match(/^Final score\s*:\s*(\d{1,5})\s*$/i);
  if (!finalMatch) return null;

  const [round1, round2, round3, round4, round5] = roundMatches;
  const finalScore = Number(finalMatch[1]);

  if ([round1, round2, round3, round4, round5, finalScore].some((n) => Number.isNaN(n))) {
    return null;
  }

  return {
    gameDateText: dateLine,
    round1,
    round2,
    round3,
    round4,
    round5,
    finalScore
  };
}

module.exports = {
  parseMapTapMessage
};
