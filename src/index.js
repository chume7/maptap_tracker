import { getConfig } from './config.js';
import { toUnixStartOfDay, formatRunTimestamp, getLocalHour } from './date-utils.js';
import { buildLeaderboardMessage } from './format.js';
import { fetchGroupMessages, postBotMessage } from './groupme.js';
import { parseMapTapMessage } from './parser.js';

function shouldIgnoreMessage(message) {
  if (!message) return true;
  if (message.system) return true;
  if (message.sender_type === 'bot') return true;
  if (!message.text || typeof message.text !== 'string') return true;
  return false;
}

async function fetchAllMessagesSince({ accessToken, groupId, startUnix }) {
  const allMessages = [];
  let beforeId = undefined;

  while (true) {
    const batch = await fetchGroupMessages({ accessToken, groupId, beforeId, limit: 100 });
    if (!batch.length) break;

    allMessages.push(...batch);

    const oldest = batch[batch.length - 1];
    if (!oldest?.id) break;

    const oldestCreatedAt = Number(oldest.created_at || 0);
    if (oldestCreatedAt < startUnix) {
      break;
    }

    beforeId = oldest.id;
  }

  return allMessages.filter((message) => Number(message.created_at || 0) >= startUnix);
}

function buildStats(messages) {
  const totals = new Map();

  for (const message of messages) {
    if (shouldIgnoreMessage(message)) continue;

    const parsed = parseMapTapMessage(message.text);
    if (!parsed) continue;

    const userId = String(message.user_id || message.sender_id || '').trim();
    const userName = String(message.name || 'Unknown User').trim();
    if (!userId) continue;

    const existing = totals.get(userId) || {
      userId,
      userName,
      totalScore: 0,
      count: 0
    };

    existing.userName = userName || existing.userName;
    existing.totalScore += parsed.finalScore;
    existing.count += 1;

    totals.set(userId, existing);
  }

  return [...totals.values()]
    .filter((row) => row.count > 0)
    .map((row) => ({
      userId: row.userId,
      userName: row.userName,
      average: row.totalScore / row.count,
      count: row.count,
      totalScore: row.totalScore
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count || a.userName.localeCompare(b.userName));
}

async function main() {
  const config = getConfig();
  const startUnix = toUnixStartOfDay(config.startDate);


  const localHour = getLocalHour(config.timezone);
  if (localHour !== 12) {
    console.log(`Skipping post because local hour in ${config.timezone} is ${localHour}, not 12.`);
    return;
  }

  console.log(`Fetching GroupMe messages from ${config.startDate} onward...`);
  const messages = await fetchAllMessagesSince({
    accessToken: config.accessToken,
    groupId: config.groupId,
    startUnix
  });

  console.log(`Fetched ${messages.length} messages in range.`);
  const rows = buildStats(messages);
  console.log(`Found ${rows.length} users with valid MapTap entries.`);

  const runTimestamp = formatRunTimestamp(config.timezone);
  const text = buildLeaderboardMessage({
    title: config.title,
    rows,
    footer: config.footer,
    runTimestamp
  });

  console.log('\nLeaderboard preview:\n');
  console.log(text);

  if (config.dryRun) {
    console.log('\nDRY_RUN=true, so nothing was posted to GroupMe.');
    return;
  }

  await postBotMessage({ botId: config.botId, text });
  console.log('\nPosted leaderboard to GroupMe successfully.');
}

main().catch((error) => {
  console.error('\nRun failed:');
  console.error(error);
  process.exit(1);
});
