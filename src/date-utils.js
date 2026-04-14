export function toUnixStartOfDay(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid MAPTAP_START_DATE: ${dateString}. Expected YYYY-MM-DD.`);
  }
  return Math.floor(date.getTime() / 1000);
}

export function formatRunTimestamp(timezone = 'America/New_York') {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone
  }).format(new Date());
}

export function getLocalHour(timezone = 'America/New_York') {
  return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }).format(new Date()));
}
