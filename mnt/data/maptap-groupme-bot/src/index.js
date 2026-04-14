const express = require('express');
const config = require('./config');
const { parseMapTapMessage } = require('./parser');
const { insertSubmission, getLeaderboard, getStats, hasJobRun, recordJobRun } = require('./db');
const { postBotMessage, fetchGroupMessagesPage } = require('./groupme');

const app = express();
app.use(express.json({ limit: '1mb' }));

function getLocalDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    dateLocal: `${parts.year}-${parts.month}-${parts.day}`,
    hourLocal: Number(parts.hour)
  };
}

function formatLeaderboardMessage(rows) {
  const lines = ['MapTap All-Time Average'];
  rows.forEach((row, index) => {
    lines.push(`${index + 1}. ${row.userName}: ${row.averageFinalScore}`);
  });
  return lines.join('\n');
}

function hasValidJobSecret(req) {
  const provided = req.header('x-job-secret') || req.query.secret;
  return Boolean(provided) && provided === config.dailyJobSecret;
}

async function runBackfill(limitPages = null) {
  let beforeId = null;
  let pageCount = 0;
  let scanned = 0;
  let inserted = 0;
  let duplicates = 0;
  let matched = 0;

  while (true) {
    if (limitPages !== null && pageCount >= limitPages) break;
    const messages = await fetchGroupMessagesPage({ beforeId, limit: 100 });
    if (!messages.length) break;

    pageCount += 1;

    for (const message of messages) {
      scanned += 1;
      if (message.system) continue;
      if (message.sender_type === 'bot') continue;
      if (String(message.group_id) !== String(config.groupmeGroupId)) continue;
      if (!message.text) continue;

      const parsed = parseMapTapMessage(message.text);
      if (!parsed) continue;
      matched += 1;

      const result = insertSubmission({
        groupId: String(message.group_id),
        messageId: String(message.id),
        userId: String(message.user_id || message.sender_id || 'unknown'),
        userName: String(message.name || 'Unknown'),
        gameDateText: parsed.gameDateText,
        round1: parsed.round1,
        round2: parsed.round2,
        round3: parsed.round3,
        round4: parsed.round4,
        round5: parsed.round5,
        finalScore: parsed.finalScore,
        createdAtGroupme: message.created_at || null,
        rawText: message.text
      });

      if (result.inserted) inserted += 1;
      else duplicates += 1;
    }

    beforeId = messages[messages.length - 1]?.id;
    if (!beforeId || messages.length < 100) break;
  }

  return { pageCount, scanned, matched, inserted, duplicates };
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: config.nodeEnv,
    timezone: config.timezone,
    stats: getStats()
  });
});

app.post('/groupme/callback', (req, res) => {
  try {
    const msg = req.body || {};

    if (msg.system) return res.sendStatus(200);
    if (msg.sender_type === 'bot') return res.sendStatus(200);
    if (String(msg.group_id) !== String(config.groupmeGroupId)) return res.sendStatus(200);
    if (!msg.text) return res.sendStatus(200);

    const parsed = parseMapTapMessage(msg.text);
    if (!parsed) return res.sendStatus(200);

    insertSubmission({
      groupId: String(msg.group_id),
      messageId: String(msg.id),
      userId: String(msg.user_id || msg.sender_id || 'unknown'),
      userName: String(msg.name || 'Unknown'),
      gameDateText: parsed.gameDateText,
      round1: parsed.round1,
      round2: parsed.round2,
      round3: parsed.round3,
      round4: parsed.round4,
      round5: parsed.round5,
      finalScore: parsed.finalScore,
      createdAtGroupme: msg.created_at || null,
      rawText: msg.text
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error('Callback processing error:', error);
    return res.sendStatus(500);
  }
});

app.post('/jobs/daily-post', async (req, res) => {
  try {
    if (!hasValidJobSecret(req)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { dateLocal, hourLocal } = getLocalDateParts(new Date());
    if (hourLocal !== config.dailyPostHourLocal) {
      return res.json({
        ok: true,
        skipped: true,
        reason: `Local hour ${hourLocal} does not match configured posting hour ${config.dailyPostHourLocal}`,
        dateLocal
      });
    }

    if (hasJobRun('daily-post', dateLocal)) {
      return res.json({ ok: true, skipped: true, reason: 'Already posted today', dateLocal });
    }

    const rows = getLeaderboard();
    if (!rows.length) {
      recordJobRun('daily-post', dateLocal);
      return res.json({ ok: true, skipped: true, reason: 'No scores found', dateLocal });
    }

    const message = formatLeaderboardMessage(rows);
    await postBotMessage(message);
    recordJobRun('daily-post', dateLocal);

    return res.json({ ok: true, posted: true, dateLocal, rows: rows.length });
  } catch (error) {
    console.error('Daily post error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/jobs/backfill', async (req, res) => {
  try {
    if (!hasValidJobSecret(req)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const result = await runBackfill();
    return res.json({ ok: true, result });
  } catch (error) {
    console.error('Backfill error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/leaderboard', (req, res) => {
  res.json({ ok: true, leaderboard: getLeaderboard() });
});

if (require.main === module) {
  config.requireRuntimeConfig();
  app.listen(config.port, () => {
    console.log(`MapTap bot listening on port ${config.port}`);
  });
}

module.exports = {
  app,
  runBackfill,
  formatLeaderboardMessage,
  getLocalDateParts
};
