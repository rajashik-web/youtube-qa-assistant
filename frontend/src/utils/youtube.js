const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts the 11-character video ID from common YouTube URL shapes:
 *  - https://www.youtube.com/watch?v=ID
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/embed/ID
 *  - https://m.youtube.com/watch?v=ID
 * Returns null if the string doesn't look like a valid YouTube video URL.
 */
export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\.|^m\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }
      const embedMatch = url.pathname.match(/^\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[2];
    }
  } catch {
    return null;
  }

  return null;
}

export function isValidYouTubeUrl(input) {
  return extractYouTubeId(input) !== null;
}
