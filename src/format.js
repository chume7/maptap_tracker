export function buildLeaderboardMessage({ title, rows, footer = '', runTimestamp }) {
  const header = title.trim();

  const body = rows.length
    ? rows
        .map((row, index) => `${index + 1}. ${row.userName}: ${row.average.toFixed(1)}`)
        .join('\n')
    : 'No valid MapTap entries were found.';

  const pieces = [header, body, `Updated: ${runTimestamp}`];
  if (footer && footer.trim()) {
    pieces.push(footer.trim());
  }

  const message = pieces.join('\n\n');
  if (message.length <= 1000) return message;

  // Trim very long leaderboards to avoid GroupMe length issues.
  const trimmedRows = [];
  let candidate = `${header}\n\n`;
  for (const [index, row] of rows.entries()) {
    const nextLine = `${index + 1}. ${row.userName}: ${row.average.toFixed(1)}\n`;
    if ((candidate + nextLine + `\nUpdated: ${runTimestamp}`).length > 950) break;
    candidate += nextLine;
    trimmedRows.push(row);
  }

  const trimmedBody = trimmedRows.length
    ? trimmedRows.map((row, index) => `${index + 1}. ${row.userName}: ${row.average.toFixed(1)}`).join('\n')
    : 'No valid MapTap entries were found.';

  return [header, trimmedBody, `Updated: ${runTimestamp}`].join('\n\n');
}
