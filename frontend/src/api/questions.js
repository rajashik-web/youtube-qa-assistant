import { apiClient } from './client';

/**
 * Asks a question about a processed video.
 * Backend response includes: answer, sources[]
 */
export function askQuestion({ videoId, question }, opts) {
  return apiClient.post('/ask', { video_id: videoId, question }, opts);
}
