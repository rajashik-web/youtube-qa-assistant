/**
 * Formats a duration in seconds as m:ss or h:mm:ss.
 * Falls back gracefully if a pre-formatted value already exists.
 */
export function formatTimestamp(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) return '0:00';
  const total = Math.max(0, Math.floor(Number(seconds)));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Relative "2h ago" style date formatting for library metadata.
 */
export function formatRelativeDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < 45) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Builds a YouTube URL that jumps to a specific second.
 */
export function buildTimestampUrl(videoId, startTimeSeconds) {
  const t = Math.max(0, Math.floor(Number(startTimeSeconds) || 0));
  return `https://www.youtube.com/watch?v=${videoId}&t=${t}s`;
}

/**
 * Compact number formatting for chunk/segment counts (e.g. 1,204).
 */
export function formatCount(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}
