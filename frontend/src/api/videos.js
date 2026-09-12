import { apiClient } from "./client";

/**
 * Fetch the authenticated user's video library.
 */
export function getVideos(opts) {
  return apiClient.get("/videos", opts);
}

/**
 * Submit a YouTube URL for processing (or re-processing).
 */
export function processVideo({ url, forceReprocess = false }, opts) {
  return apiClient.post(
    "/videos/process",
    { url, force_reprocess: forceReprocess },
    opts,
  );
}

/**
 * Fetch the current processing status of a specific video.
 */
export function getVideoStatus(videoId, opts) {
  return apiClient.get(`/videos/${videoId}/status`, opts);
}

/**
 * Delete a video from the library.
 */
export function deleteVideo(videoId, opts) {
  return apiClient.delete(`/videos/${videoId}`, opts);
}
