/**
 * YouTube URL validation utilities.
 */

const YT_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=[\w-]+/,
  /^https?:\/\/youtu\.be\/[\w-]+/,
  /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
];

/**
 * Returns true if the given string looks like a valid YouTube video URL.
 */
export function isValidYouTubeUrl(url) {
  if (!url || typeof url !== "string") return false;
  return YT_PATTERNS.some((re) => re.test(url.trim()));
}
