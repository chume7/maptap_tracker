const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name, fallback = null) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'maptap.sqlite');
const databaseDir = path.dirname(databasePath);
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  appBaseUrl: process.env.APP_BASE_URL || '',
  groupmeAccessToken: process.env.GROUPME_ACCESS_TOKEN || '',
  groupmeBotId: process.env.GROUPME_BOT_ID || '',
  groupmeGroupId: process.env.GROUPME_GROUP_ID || '',
  dailyPostHourLocal: Number(process.env.DAILY_POST_HOUR_LOCAL || 12),
  timezone: process.env.TIMEZONE || 'America/New_York',
  dailyJobSecret: process.env.DAILY_JOB_SECRET || '',
  databasePath,
  requireRuntimeConfig() {
    requireEnv('GROUPME_ACCESS_TOKEN');
    requireEnv('GROUPME_BOT_ID');
    requireEnv('GROUPME_GROUP_ID');
    requireEnv('DAILY_JOB_SECRET');
  }
};
