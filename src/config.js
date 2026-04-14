export function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function getConfig() {
  const accessToken = requireEnv('GROUPME_ACCESS_TOKEN');
  const groupId = requireEnv('GROUPME_GROUP_ID');
  const botId = requireEnv('GROUPME_BOT_ID');

  const startDate = process.env.MAPTAP_START_DATE || '2026-03-01';
  const dryRun = (process.env.DRY_RUN || 'false').toLowerCase() === 'true';
  const timezone = process.env.TIMEZONE || 'America/New_York';
  const title = process.env.POST_TITLE || 'MapTap All-Time Average';
  const footer = process.env.POST_FOOTER || '';

  return {
    accessToken,
    groupId,
    botId,
    startDate,
    dryRun,
    timezone,
    title,
    footer
  };
}
