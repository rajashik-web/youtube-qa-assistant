/**
 * Formatting utilities for timestamps and YouTube URLs.
 */

/**
 * Converts a total number of seconds into a human-readable "MM:SS" or
 * "H:MM:SS" string. Returns "0:00" for null/undefined/NaN inputs.
 */
export function formatTimestamp(totalSeconds) {
  const secs = Math.round(Number(totalSeconds));
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Builds a YouTube watch URL that starts playback at the given timestamp.
 * Falls back to a plain watch URL when videoId or startTime is absent.
 */
export function buildTimestampUrl(videoId, startTime) {
  if (!videoId) return "#";
  const base = `https://www.youtube.com/watch?v=${videoId}`;
  const t = Math.round(Number(startTime));
  if (!Number.isFinite(t) || t <= 0) return base;
  return `${base}&t=${t}s`;
}
