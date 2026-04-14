const BASE_URL = 'https://api.groupme.com/v3';

async function handleResponse(response) {
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message = json?.meta?.errors?.join('; ') || json?.meta?.error || text || response.statusText;
    throw new Error(`GroupMe API error ${response.status}: ${message}`);
  }

  return json;
}

export async function fetchGroupMessages({ accessToken, groupId, beforeId, limit = 100 }) {
  const params = new URLSearchParams({ token: accessToken, limit: String(limit) });
  if (beforeId) params.set('before_id', beforeId);

  const url = `${BASE_URL}/groups/${groupId}/messages?${params.toString()}`;
  const response = await fetch(url, { method: 'GET' });

  if (response.status === 304) {
    return [];
  }

  const json = await handleResponse(response);
  return json?.response?.messages || [];
}

export async function postBotMessage({ botId, text }) {
  const response = await fetch(`${BASE_URL}/bots/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bot_id: botId, text })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to post bot message: ${response.status} ${body}`);
  }
}
