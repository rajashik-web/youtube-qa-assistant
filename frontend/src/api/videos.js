import { apiClient } from './client';

/**
 * Submits a YouTube URL for processing.
 * Backend response includes: video_id, title, thumbnail_url, status, segments, chunks
 */
export function processVideo({ url, forceReprocess = false }, opts) {
  return apiClient.post('/process-video', { url, force_reprocess: forceReprocess }, opts);
}

/**
 * Returns the processed video library. Supports pagination and status filtering.
 */
export function getVideos({ page = 1, pageSize = 50, status } = {}, opts) {
  return apiClient.get('/videos', {
    ...opts,
    params: { page, page_size: pageSize, status },
  });
}

/**
 * Returns current status + metadata for a single video. Used for polling
 * while a video is processing.
 */
export function getVideoStatus(videoId, opts) {
  return apiClient.get(`/video/${encodeURIComponent(videoId)}/status`, opts);
}

/**
 * Deletes a video and all associated data (metadata, vectors, cached answers).
 */
export function deleteVideo(videoId, opts) {
  return apiClient.delete(`/video/${encodeURIComponent(videoId)}`, opts);
}
