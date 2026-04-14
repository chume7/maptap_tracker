const config = require('./config');

const API_BASE = 'https://api.groupme.com/v3';

async function groupmeFetch(path, options = {}) {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('token', config.groupmeAccessToken);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(`GroupMe API error ${response.status}: ${text}`);
  }

  return json;
}

async function postBotMessage(text) {
  const response = await fetch(`${API_BASE}/bots/post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bot_id: config.groupmeBotId,
      text
    })
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to post bot message (${response.status}): ${responseText}`);
  }

  return responseText;
}

async function fetchGroupMessagesPage({ beforeId = null, limit = 100 } = {}) {
  const path = `/groups/${config.groupmeGroupId}/messages`;
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('token', config.groupmeAccessToken);
  url.searchParams.set('limit', String(limit));
  if (beforeId) url.searchParams.set('before_id', beforeId);

  const response = await fetch(url, { method: 'GET' });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch group messages (${response.status}): ${text}`);
  }

  const messages = json?.response?.messages || [];
  return messages;
}

module.exports = {
  postBotMessage,
  fetchGroupMessagesPage,
  groupmeFetch
};
